'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RoomRepository } from '@/lib/repositories/RoomRepository';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';
import { PeerManager } from '@/lib/webrtc/PeerManager';
import { Room, PresenceState, RoomEvent, Notification } from '@/types';
import { AudioPanel } from '@/components/room/AudioPanel';
import { Whiteboard } from '@/components/room/Whiteboard';
import { ParticipantList } from '@/components/room/ParticipantList';
import { StickyNotes } from '@/components/room/StickyNotes';
import { NotificationToasts } from '@/components/room/NotificationToasts';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { compressImage } from '@/lib/utils/image';
import {
  Mic, MicOff, PenTool,
  StickyNote, Music, Users, Copy, Check,
  LogOut, Leaf, ImagePlus, X,
} from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();
  const supabase = createClient();
  const roomRepo = new RoomRepository();

  // Core state
  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feature toggles
  const [isMicOn, setIsMicOn] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Participants & Streams
  const [participants, setParticipants] = useState<PresenceState[]>([]);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Map<string, MediaStream>>(new Map());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'errored' | 'disconnected'>('disconnected');

  // Background
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Refs
  const realtimeRef = useRef<RealtimeManager | null>(null);
  const peerRef = useRef<PeerManager | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Notification helper
  const addNotification = useCallback((message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = Date.now().toString();
    const notif: Notification = { id, message, type, timestamp: Date.now() };
    setNotifications((prev) => [...prev, notif]);
    setTimeout(() => removeNotification(id), 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handlePeerStream = useCallback((peerId: string, stream: MediaStream, type: string) => {
    if (type === 'audio') {
      setRemoteAudioStreams((prev) => new Map(prev).set(peerId, stream));
    }
  }, []);

  const handlePeerStreamRemoved = useCallback((peerId: string, type: string) => {
    if (type === 'audio') {
      setRemoteAudioStreams((prev) => {
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    }
  }, []);

  const handleRoomEvent = useCallback((event: RoomEvent) => {
    if (!realtimeRef.current || event.connectionId === realtimeRef.current.connectionId) return;
    
    switch (event.type) {
      case 'whiteboard-opened': 
        addNotification(`${event.userName} opened whiteboard`, 'info'); 
        break;
      case 'participant-joined':
        addNotification(`${event.userName} arrived`, 'info');
        if (peerRef.current) {
          peerRef.current.createPeerConnection(event.userId, true).catch(console.error);
        }
        break;
      case 'participant-left':
        addNotification(`${event.userName} left`, 'warning');
        setParticipants((prev) => prev.filter(p => p.user_id !== event.userId));
        if (peerRef.current) peerRef.current.removePeer(event.userId);
        break;
      case 'background-changed':
        if (event.data?.backgroundUrl !== undefined) {
          setBackgroundUrl(event.data.backgroundUrl as string | null);
        }
        break;
    }
  }, [addNotification]);

  const handlePresenceSync = useCallback((presences: PresenceState[]) => {
    setParticipants(presences);
  }, []);

  const handleRealtimeStatus = useCallback((status: any) => {
    setRealtimeStatus(status);
    if (status === 'errored') {
      addNotification('Connection unstable. Retrying...', 'warning');
    }
  }, [addNotification]);

  // Initialize room
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) {
          if (!user) router.push('/auth/login');
          return;
        }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const name = profile?.display_name || user.email?.split('@')[0] || 'User';
        if (!isMounted) return;
        setUserName(name);

        const foundRoom = await roomRepo.findByCode(code);
        if (!foundRoom || !isMounted) {
          if (!foundRoom) setError('Room not found');
          if (isMounted) setLoading(false);
          return;
        }
        setRoom(foundRoom);
        setBackgroundUrl(foundRoom.background_url);

        await roomRepo.joinRoom(foundRoom.id, user.id);
        if (!isMounted) return;

        // Initialize Peer Manager BEFORE subscribing to realtime so it's ready for the offer
        const peer = new PeerManager(code, user.id, handlePeerStream, handlePeerStreamRemoved);
        peer.connect();
        peerRef.current = peer;

        const realtime = new RealtimeManager(code);
        realtimeRef.current = realtime;

        realtime.subscribeToEvents('notifications', handleRoomEvent);
        realtime.subscribeToPresence('participants', handlePresenceSync);
        realtime.subscribeToStatus('page-status', handleRealtimeStatus);

        realtime.connect({
          user_id: user.id,
          connectionId: realtime.connectionId,
          display_name: name,
          is_mic_on: false,
          is_screen_sharing: false,
          online_at: new Date().toISOString(),
        });

        realtime.broadcastEvent({
          type: 'participant-joined',
          userId: user.id,
          userName: name,
          timestamp: Date.now(),
        });

        setLoading(false);
      } catch (err) {
        console.error('Room init error:', err);
        if (isMounted) {
          setError('Failed to load room');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (realtimeRef.current) { realtimeRef.current.disconnect(); realtimeRef.current = null; }
      if (peerRef.current) { peerRef.current.disconnect(); peerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, handlePeerStream, handlePeerStreamRemoved, handleRoomEvent, handlePresenceSync, handleRealtimeStatus]);

  const leaveRoom = async () => {
    if (realtimeRef.current && userId && userName) {
      realtimeRef.current.broadcastEvent({ type: 'participant-left', userId, userName, timestamp: Date.now() });
    }
    await roomRepo.leaveRoom(room!.id, userId);
    if (realtimeRef.current) realtimeRef.current.disconnect();
    if (peerRef.current) peerRef.current.disconnect();
    router.push('/dashboard');
  };

  const handleToggleMic = async () => {
    try {
      const newState = !isMicOn;
      if (peerRef.current) await peerRef.current.toggleMic(newState);
      setIsMicOn(newState);
      if (realtimeRef.current) {
        await realtimeRef.current.updatePresence({
          user_id: userId,
          display_name: userName,
          is_mic_on: newState,
          is_screen_sharing: false,
          online_at: new Date().toISOString(),
        });
      }
      if (room) await roomRepo.updateMicStatus(room.id, userId, newState);
    } catch (err: any) {
      addNotification('Mic access denied. If on mobile, ensure you are using HTTPS or localhost.', 'warning');
      setIsMicOn(false);
    }
  };

  const handleToggleWhiteboard = () => {
    const newState = !showWhiteboard;
    setShowWhiteboard(newState);
    if (realtimeRef.current) {
      realtimeRef.current.broadcastEvent({ type: newState ? 'whiteboard-opened' : 'whiteboard-closed', userId, userName, timestamp: Date.now() });
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit (we compress on client)
      addNotification("Highly detailed image! Resizing for best performance...", "info");
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rawUrl = ev.target?.result as string;
        
        // --- COMPRESSION (The Developer Fix) ---
        // Ensuring the image is optimized for storage/transfer fixes 
        // the "reverting on refresh" issue by keeping it under DB/Proxy limits.
        const compressedUrl = await compressImage(rawUrl, 1920, 0.75);
        
        setBackgroundUrl(compressedUrl);

        if (room) {
          const success = await roomRepo.updateBackground(room.id, compressedUrl);
          if (success) {
            addNotification("Room background updated", "success");
          } else {
            addNotification("Database limit reached. Try a smaller file.", "warning");
          }
        }

        // Broadcast to existing participants
        if (realtimeRef.current) {
          realtimeRef.current.broadcastEvent({ 
            type: 'background-changed', 
            userId, userName, 
            data: { backgroundUrl: compressedUrl }, 
            timestamp: Date.now() 
          });
        }
      } catch (err) {
        console.error('Background update error:', err);
        addNotification('Atmosphere failed to shift.', 'warning');
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="room-loading-inner">
          <Leaf size={28} strokeWidth={1.2} className="room-loading-leaf" />
          <p className="room-loading-text">settling in…</p>
        </div>
        <style>{`
          .room-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-background);
          }
          .room-loading-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            opacity: 0;
            animation: fadeIn 0.6s ease forwards;
          }
          .room-loading-leaf {
            color: var(--color-primary);
            animation: breathe 2.5s ease-in-out infinite;
          }
          .room-loading-text {
            font-family: var(--font-body);
            font-style: italic;
            font-size: 1rem;
            color: var(--color-text-muted);
            letter-spacing: 0.04em;
          }
          @keyframes breathe {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error-root">
        <div className="room-error-card">
          <Leaf size={32} strokeWidth={1} className="room-error-leaf" />
          <h2 className="room-error-title">something went wrong.</h2>
          <p className="room-error-msg">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="room-error-btn">
            take me back
          </button>
        </div>
        <style>{`
          .room-error-root {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-background);
            padding: 2rem;
          }
          .room-error-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1.2rem;
            max-width: 360px;
            animation: fadeUp 0.7s ease both;
          }
          .room-error-leaf { color: var(--color-primary); opacity: 0.5; }
          .room-error-title {
            font-family: var(--font-heading);
            font-size: 1.9rem;
            font-weight: 500;
            color: var(--color-text);
          }
          .room-error-msg {
            font-family: var(--font-body);
            font-style: italic;
            color: var(--color-text-muted);
            font-size: 0.95rem;
          }
          .room-error-btn {
            margin-top: 0.5rem;
            padding: 0.85rem 2.5rem;
            border-radius: 100px;
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text);
            font-family: var(--font-body);
            font-style: italic;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .room-error-btn:hover {
            background: var(--color-text);
            color: var(--color-background);
            border-color: var(--color-text);
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="room-root"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',   
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',         
      }}
    >
      {/* Audio blocking overlay for mobile/strict browsers */}
      {audioBlocked && (
        <div className="audio-blocked-overlay">
          <div className="audio-blocked-card">
            <Music size={24} className="audio-blocked-icon" />
            <p>Audio is paused by your browser.</p>
            <button 
              onClick={() => {
                setAudioBlocked(false);
                // Standard trick to unlock audio on mobile
                const dummy = new Audio();
                dummy.play().catch(() => {});
              }} 
              className="audio-blocked-btn"
            >
              Enable Sound
            </button>
          </div>
          <style>{`
            .audio-blocked-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.4);
              backdrop-filter: blur(8px);
              z-index: 1000;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: fadeIn 0.4s ease;
            }
            .audio-blocked-card {
              background: var(--color-surface);
              padding: 2rem;
              border-radius: 2rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1.2rem;
              box-shadow: 0 20px 50px rgba(0,0,0,0.2);
              border: 1px solid var(--color-border);
              text-align: center;
              max-width: 280px;
            }
            .audio-blocked-icon { color: var(--color-primary); }
            .audio-blocked-card p {
              font-family: var(--font-body);
              font-style: italic;
              color: var(--color-text);
              font-size: 0.95rem;
            }
            .audio-blocked-btn {
              padding: 0.8rem 1.6rem;
              border-radius: 100px;
              background: var(--color-primary);
              color: var(--color-text-on-primary);
              border: none;
              font-family: var(--font-sans);
              font-weight: 600;
              font-size: 0.85rem;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .audio-blocked-btn:hover { transform: scale(1.05); }
          `}</style>
        </div>
      )}

      {/* Realtime status indicator (Subtle) */}
      <div className={`status-dot-wrap status-dot--${realtimeStatus}`} title={`Status: ${realtimeStatus}`}>
        <div className="status-dot" />
        <style>{`
          .status-dot-wrap {
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 100;
            display: flex;
            align-items: center;
            opacity: 0.5;
            pointer-events: none;
          }
          .status-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #ccc;
          }
          .status-dot--connected .status-dot { background: #94A89A; box-shadow: 0 0 8px #94A89A; }
          .status-dot--connecting .status-dot { background: #E8DCC4; animation: blink 1s infinite; }
          .status-dot--errored .status-dot { background: #D69E9E; }
          @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        `}</style>
      </div>

      {/* Soft diffusion layer for custom backgrounds */}
      {backgroundUrl && <div className="room-bg-overlay" 
      style={{ opacity: 0.2 }}/>}

      {/* Ambient orbs (only without custom bg) */}
      {!backgroundUrl && (
        <div className="room-ambient" aria-hidden="true">
          <div className="room-orb room-orb-1" />
          <div className="room-orb room-orb-2" />
        </div>
      )}

      {/* ── Header ── */}
      <header className="room-header">
        <div className="room-header-left">
          <div className="room-logo-mark">
            <Leaf size={16} strokeWidth={1.5} />
          </div>
          <h1 className="room-name">{room?.name}</h1>
          <button
            className="room-code-pill"
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            title="Copy room code"
          >
            {copiedCode ? <Check size={12} /> : <Copy size={12} />}
            <span>{code}</span>
          </button>
        </div>

        <div className="room-header-right">
          <ThemeSwitcher />
          <div className="room-header-sep" />
          <button onClick={leaveRoom} className="room-leave-btn" title="Leave room">
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="room-layout">

        {/* Participants panel */}
        {showParticipants && (
          <aside className="room-panel room-panel--left">
            <div className="room-panel-header">
              <span className="room-panel-title">in the room</span>
              <button className="room-panel-close" onClick={() => setShowParticipants(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="room-panel-body">
              <ParticipantList 
                participants={participants} 
                currentUserId={userId} 
                hostId={room?.created_by || ''} 
              />
            </div>
          </aside>
        )}

        {/* Canvas */}
        <main className="room-canvas">
          {/* Whiteboard */}
          <div className={`room-whiteboard-wrap ${showWhiteboard ? 'room-whiteboard-wrap--visible' : ''}`}>
            <Whiteboard
              roomCode={code}
              userId={userId}
              roomId={room?.id || ''}
              realtimeManager={realtimeRef.current}
            />
          </div>

          {/* Empty state poetry */}
          {!showWhiteboard && (
            <div className="room-empty">
              <Leaf size={40} strokeWidth={1} className="room-empty-leaf" />
              <p className="room-empty-title">the space is yours.</p>
              <p className="room-empty-sub">a quiet place to gather your thoughts.</p>
            </div>
          )}
        </main>

        {/* Audio panel */}
        {showAudioPanel && (
          <aside className="room-panel room-panel--right">
            <div className="room-panel-header">
              <span className="room-panel-title">atmosphere</span>
              <button className="room-panel-close" onClick={() => setShowAudioPanel(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="room-panel-body">
            <AudioPanel
              realtimeManager={realtimeRef.current}
              userId={userId}
              userName={userName}
            />
            </div>
          </aside>
        )}
      </div>

      {/* Sticky notes */}
      {showNotes && room && (
        <div className="room-notes-anchor">
          <StickyNotes roomId={room.id} userId={userId} onClose={() => setShowNotes(false)} />
        </div>
      )}

      {/* Notifications */}
      <div className="room-toasts">
        <NotificationToasts
          notifications={notifications}
          onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        />
      </div>

      {/* ── Dock ── */}
      <footer className="room-dock">
        <button
          onClick={handleToggleMic}
          className={`dock-btn ${isMicOn ? 'dock-btn--active' : ''}`}
          title={isMicOn ? 'Mute' : 'Unmute'}
        >
          {isMicOn ? <Mic size={18} strokeWidth={1.8} /> : <MicOff size={18} strokeWidth={1.8} />}
        </button>

        <button
          onClick={handleToggleWhiteboard}
          className={`dock-btn ${showWhiteboard ? 'dock-btn--active' : ''}`}
          title="Whiteboard"
        >
          <PenTool size={18} strokeWidth={1.8} />
        </button>

        <div className="dock-sep" />

        <button
          onClick={() => setShowAudioPanel(!showAudioPanel)}
          className={`dock-btn ${showAudioPanel ? 'dock-btn--active' : ''}`}
          title="Atmosphere"
        >
          <Music size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`dock-btn ${showNotes ? 'dock-btn--active' : ''}`}
          title="Sticky Notes"
        >
          <StickyNote size={18} strokeWidth={1.8} />
        </button>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`dock-btn dock-btn--count ${showParticipants ? 'dock-btn--active' : ''}`}
          title="Participants"
        >
          <Users size={18} strokeWidth={1.8} />
          {participants.length > 0 && (
            <span className="dock-count">{participants.length}</span>
          )}
        </button>

        <div className="dock-sep" />

        <button onClick={() => bgInputRef.current?.click()} className="dock-btn" title="Set Background">
          <ImagePlus size={18} strokeWidth={1.8} />
        </button>
        <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />

        {backgroundUrl && (
          <button
            onClick={() => {
              setBackgroundUrl(null);
              if (realtimeRef.current) realtimeRef.current.broadcastEvent({ type: 'background-changed', userId, userName, data: { backgroundUrl: null }, timestamp: Date.now() });
            }}
            className="dock-btn dock-btn--danger"
            title="Remove Background"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        )}
      </footer>

      {/* Hidden Audio Elements for Remote Streams */}
      {Array.from(remoteAudioStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudioPlayer key={peerId} stream={stream} onBlocked={() => setAudioBlocked(true)} />
      ))}

      <style>{`
        /* ── ROOT ── */
        .room-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: var(--color-background);
          transition: background 1s ease;
        }

        /* ── OVERLAYS ── */
        .room-bg-overlay {
          position: absolute;
          inset: 0;
          background: var(--color-background);
          backdrop-filter: blur(2px);
          z-index: 0;
        }

        .room-ambient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .room-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          animation: orbDrift 22s ease-in-out infinite alternate;
        }
        .room-orb-1 {
          width: 50vw; height: 50vw;
          top: -20%; right: -10%;
          background: var(--color-secondary);
          opacity: 0.45;
        }
        .room-orb-2 {
          width: 35vw; height: 35vw;
          bottom: 0; left: -5%;
          background: var(--color-primary);
          opacity: 0.08;
          animation-delay: -9s;
        }
        @keyframes orbDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(2%, 4%) scale(1.06); }
        }

        /* ── HEADER ── */
        .room-header {
          position: relative;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.6rem 2.5rem;
          animation: fadeDown 0.6s ease both;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .room-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .room-logo-mark {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 50%;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          box-shadow: 0 4px 14px var(--color-shadow);
          flex-shrink: 0;
        }

        .room-name {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: -0.01em;
        }

        .room-code-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.4rem 0.9rem;
          border-radius: 100px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px var(--color-shadow);
        }
        .room-code-pill:hover {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-on-primary);
        }

        .room-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          padding: 0.35rem 0.6rem;
          box-shadow: 0 4px 14px var(--color-shadow);
        }

        .room-header-sep {
          width: 1px;
          height: 16px;
          background: var(--color-border);
          margin: 0 0.1rem;
        }

        .room-leave-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .room-leave-btn:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }

        /* ── LAYOUT ── */
        .room-layout {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          gap: 1.5rem;
          padding: 0 2rem 9rem;
          min-height: 0;
        }

        /* ── PANELS ── */
        .room-panel {
          width: 17rem;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          box-shadow: 0 12px 35px -8px var(--color-shadow-lg);
          overflow: hidden;
          animation: panelIn 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          max-height: calc(100vh - 12rem);
          backdrop-filter: blur(12px);
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-12px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .room-panel--right {
          animation-name: panelInRight;
        }
        @keyframes panelInRight {
          from { opacity: 0; transform: translateX(12px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        .room-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .room-panel-title {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 500;
          font-style: italic;
          color: var(--color-text);
        }
        .room-panel-close {
          width: 1.8rem;
          height: 1.8rem;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .room-panel-close:hover {
          background: var(--color-background);
          color: var(--color-text);
        }
        .room-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.2rem 1.5rem 1.5rem;
          scrollbar-width: none;
        }
        .room-panel-body::-webkit-scrollbar { display: none; }

        /* ── CANVAS ── */
        .room-canvas {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        /* Whiteboard */
        .room-whiteboard-wrap {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: scale(0.98);
          transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          pointer-events: none;
          z-index: -1;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 20px 60px -15px var(--color-shadow-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
        }
        .room-whiteboard-wrap--visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
          z-index: 10;
        }

        /* Empty state */
        .room-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.8rem;
          pointer-events: none;
          animation: emptyFade 1s ease both;
        }
        @keyframes emptyFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 0.35; transform: translateY(0); }
        }
        .room-empty-leaf {
          color: var(--color-primary);
          margin-bottom: 0.4rem;
        }
        .room-empty-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 400;
          font-style: italic;
          color: var(--color-text);
          line-height: 1.2;
        }
        .room-empty-sub {
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-style: italic;
          color: var(--color-text-muted);
        }

        /* ── NOTES ── */
        .room-notes-anchor {
          position: fixed;
          left: 2rem;
          bottom: 8rem;
          z-index: 40;
        }

        /* ── TOASTS ── */
        .room-toasts {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 60;
          pointer-events: none;
        }

        /* ── DOCK ── */
        .room-dock {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 1.4rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          box-shadow: 0 16px 48px -8px var(--color-shadow-lg), 0 4px 16px var(--color-shadow);
          backdrop-filter: blur(20px);
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
          animation: dockRise 0.7s 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .room-dock:hover {
          transform: translateX(-50%) translateY(-3px);
          box-shadow: 0 24px 60px -10px var(--color-shadow-lg), 0 6px 20px var(--color-shadow);
        }
        @keyframes dockRise {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .dock-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          color: var(--color-text-muted);
          cursor: pointer;
          position: relative;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          flex-shrink: 0;
        }
        .dock-btn:hover {
          color: var(--color-text);
          transform: translateY(-4px) scale(1.06);
          box-shadow: 0 10px 24px var(--color-shadow-lg);
          border-color: var(--color-text-muted);
          background: var(--color-surface);
        }
        .dock-btn--active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-on-primary);
          box-shadow: 0 6px 20px rgba(148, 168, 154, 0.35);
        }
        .dock-btn--active:hover {
          background: var(--color-primary-hover);
          border-color: var(--color-primary-hover);
          color: var(--color-text-on-primary);
        }
        .dock-btn--danger:hover {
          background: var(--color-danger-bg);
          border-color: var(--color-danger-border);
          color: var(--color-danger);
        }
        .dock-btn--count { position: relative; }

        .dock-count {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 50%;
          background: var(--color-primary);
          color: var(--color-text-on-primary);
          font-family: var(--font-sans);
          font-size: 0.58rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--color-surface);
          box-shadow: 0 2px 6px rgba(148, 168, 154, 0.4);
        }

        .dock-sep {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--color-border);
          flex-shrink: 0;
          margin: 0 0.1rem;
        }

        .hidden { display: none; }
      `}</style>
    </div>
  );
}

// Hidden audio renderer with autoplay error handling
function RemoteAudioPlayer({ stream, onBlocked }: { stream: MediaStream; onBlocked: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      
      // Attempt to play and catch blocking
      audioRef.current.play().catch(err => {
        if (err.name === 'NotAllowedError') {
          console.warn('[WebRTC] Audio playback blocked by browser policy');
          onBlocked();
        }
      });
    }
  }, [stream, onBlocked]);

  return (
    <audio ref={audioRef} autoPlay style={{ display: 'none' }}>
      <track kind="captions" />
    </audio>
  );
}