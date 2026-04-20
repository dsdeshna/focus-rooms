'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RoomRepository } from '@/lib/repositories/RoomRepository';
import { Header } from '@/components/layout/Header';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Room } from '@/types';

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const roomRepo = new RoomRepository();

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser || !isMounted) { router.push('/auth/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', authUser.id).single();
        let name = 'User';
        if (!profile) {
          name = authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
          await supabase.from('profiles').upsert({ id: authUser.id, display_name: name, avatar_url: authUser.user_metadata?.avatar_url || null });
        } else {
          name = profile.display_name || authUser.email?.split('@')[0] || 'User';
        }
        if (isMounted) setUser({ id: authUser.id, email: authUser.email || '', name });
        try {
          const rooms = await roomRepo.getSavedRooms(authUser.id);
          if (isMounted) setMyRooms(rooms);
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Dashboard init error:', err);
        if (isMounted) setError('Failed to load your profile.');
      }
    };
    fetchUser();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !user) return;
    setCreating(true); setError('');
    try {
      const room = await roomRepo.create(roomName.trim(), user.id);
      router.push(`/room/${room.code}`);
    } catch { setError('Failed to create room.'); setCreating(false); }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setJoining(true); setError('');
    try {
      const room = await roomRepo.findByCode(joinCode.trim().toUpperCase());
      if (!room) { setError('No room found with that code.'); setJoining(false); return; }
      if (!room.is_active) { setError('This room is closed.'); setJoining(false); return; }
      router.push(`/room/${room.code}`);
    } catch { setError('Failed to join room.'); setJoining(false); }
  };

  const handleCopyCode = (code: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleRenameRoom = async (roomId: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!editName.trim() || !user) { setEditingRoom(null); return; }
    
    // Check ownership before attempting
    const room = myRooms.find(r => r.id === roomId);
    if (!room || room.created_by !== user.id) {
      setError('Only the room creator can rename it.');
      setEditingRoom(null);
      return;
    }

    setActionLoading(true); setError('');
    try {
      await roomRepo.rename(roomId, editName.trim());
      setMyRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: editName.trim() } : r));
      setEditingRoom(null);
    } catch { 
      setError('Failed to rename room.'); 
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomCode: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!user) return;

    const room = myRooms.find(r => r.id === roomId);
    if (!room) return;

    const isOwner = room.created_by === user.id;
    const message = isOwner 
      ? `Are you sure you want to delete room ${roomCode}? This removes it for everyone.` 
      : `Remove room ${roomCode} from your spaces?`;

    if (!confirm(message)) return;
    
    setActionLoading(true); setError('');
    try {
      if (isOwner) {
        await roomRepo.delete(roomId);
      } else {
        await roomRepo.unjoinRoom(roomId, user.id);
      }
      setMyRooms(prev => prev.filter(r => r.id !== roomId));
    } catch { 
      setError(isOwner ? 'Failed to delete room.' : 'Failed to remove room.'); 
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return (
    <div className="db-loading">
      <Loader2 size={28} className="spin" />
    </div>
  );

  return (
    <div className="db-root">
      <Header user={user} />

      {/* Ambient */}
      <div className="db-ambient" aria-hidden="true">
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />
      </div>

      <main className="db-main">

        {/* ── Greeting ── */}
        <section className="db-greeting">
          <p className="db-greeting-pre">good to see you</p>
          <h1 className="db-greeting-name">{user.name}.</h1>
          <p className="db-greeting-sub">what are we pretending to work on today?</p>
        </section>

        {error && <div className="db-error">{error}</div>}

        {/* ── Room Action Card ── */}
        <section className="db-action-card">
          {/* Tabs */}
          <div className="db-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'create'}
              className={`db-tab ${activeTab === 'create' ? 'db-tab--active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              🌱 create a room
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'join'}
              className={`db-tab ${activeTab === 'join' ? 'db-tab--active' : ''}`}
              onClick={() => setActiveTab('join')}
            >
              🚪 join a room
            </button>
          </div>

          {activeTab === 'create' && (
            <div className="db-panel db-panel--create" role="tabpanel">
              <p className="db-panel-desc">give your room a name, and share the code with friends.</p>
              <div className="db-field-row">
                <input
                  type="text" value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  className="db-input db-input--room"
                  placeholder="what are you working on?"
                  onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />
                <button
                  onClick={handleCreateRoom}
                  className="db-btn-primary"
                  disabled={creating || !roomName.trim()}
                >
                  {creating ? <Loader2 size={18} className="spin" /> : 'create →'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="db-panel db-panel--join" role="tabpanel">
              <p className="db-panel-desc">enter a 6-letter code to join a friend's room.</p>
              <div className="db-field-row">
                <input
                  type="text" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="db-input db-input--code"
                  placeholder="· · · · · ·"
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                  autoFocus
                />
                <button
                  onClick={handleJoinRoom}
                  className="db-btn-primary"
                  disabled={joining || joinCode.length === 0}
                >
                  {joining ? <Loader2 size={18} className="spin" /> : 'enter →'}
                </button>
              </div>
            </div>
          )}
        </section>

        {myRooms.length > 0 && (
          <section className="db-spaces">
            <div className="db-spaces-header">
              <span className="db-spaces-label">your spaces</span>
              <div className="db-spaces-line" />
            </div>

            <div className="db-rooms-grid">
              {myRooms.map((room, i) => (
                <div
                  key={room.id}
                  className="db-room-card"
                  onClick={() => !editingRoom && router.push(`/room/${room.code}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!editingRoom) router.push(`/room/${room.code}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Room ${room.name}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="db-room-top">
                    <span className="db-room-num">0{i + 1}</span>
                    <div className="db-room-actions">
                      {room.created_by === user.id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingRoom(room.id); setEditName(room.name); }} 
                          className="db-room-icon-btn"
                          title="Rename room"
                          disabled={actionLoading}
                        >
                          ✏️
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDeleteRoom(room.id, room.code, e)} 
                        className="db-room-icon-btn"
                        title={room.created_by === user.id ? "Delete room for all" : "Remove from my spaces"}
                        disabled={actionLoading}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {editingRoom === room.id ? (
                    <div className="db-room-edit-row" onClick={e => e.stopPropagation()}>
                      <input 
                        type="text" value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameRoom(room.id, e)}
                        autoFocus
                        className="db-input db-room-edit-input"
                        disabled={actionLoading}
                      />
                      <button className="db-room-icon-btn" onClick={e => handleRenameRoom(room.id, e)} disabled={actionLoading}>
                        {actionLoading ? <Loader2 size={12} className="spin" /> : '✔️'}
                      </button>
                      <button className="db-room-icon-btn" onClick={e => { e.stopPropagation(); setEditingRoom(null); }} disabled={actionLoading}>
                        ❌
                      </button>
                    </div>
                  ) : (
                    <div className="db-room-name-wrap">
                      <h3 className="db-room-name">{room.name}</h3>
                      {room.created_by === user.id && (
                        <span className="db-room-owner-badge">(created by you)</span>
                      )}
                    </div>
                  )}

                  <div className="db-room-footer">
                    <span className="db-room-code">{room.code}</span>
                    <button
                      onClick={e => handleCopyCode(room.code, e)}
                      className="db-room-copy"
                      title="Copy code"
                    >
                      {copiedCode === room.code
                        ? <Check size={13} style={{ color: 'var(--color-primary)' }} />
                        : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{`
        .db-root {
          min-height: 100vh;
          background: var(--color-background);
          position: relative;
          overflow-x: hidden;
        }
        .db-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .db-ambient {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .db-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }
        .db-orb-1 {
          width: 50vw; height: 50vw;
          top: -10%; right: -10%;
          background: var(--color-secondary);
          opacity: 0.4;
          animation: driftA 18s ease-in-out infinite alternate;
        }
        .db-orb-2 {
          width: 35vw; height: 35vw;
          bottom: 5%; left: -5%;
          background: var(--color-primary);
          opacity: 0.08;
          animation: driftA 24s ease-in-out infinite alternate-reverse;
        }
        @keyframes driftA {
          from { transform: translate(0, 0); }
          to   { transform: translate(4%, 6%); }
        }
        .db-main {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 10rem 2rem 6rem;
          display: flex;
          flex-direction: column;
          gap: 4rem;
        }
        .db-greeting {
          text-align: center;
          animation: fadeUp 0.7s ease both;
        }
        .db-greeting-pre {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 0.75rem;
        }
        .db-greeting-name {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 400;
          color: var(--color-text);
          line-height: 1;
          margin-bottom: 1rem;
        }
        .db-greeting-sub {
          font-family: var(--font-body);
          color: var(--color-text-muted);
          font-size: 1.05rem;
        }
        .db-error {
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger-border);
          color: var(--color-danger);
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          text-align: center;
          animation: fadeUp 0.4s ease both;
        }
        .db-action-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 8px 40px -10px var(--color-shadow-lg);
          animation: fadeUp 0.8s 0.1s ease both;
        }
        .db-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }
        .db-tab {
          flex: 1;
          padding: 1.4rem 2rem;
          background: none;
          border: none;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.95rem;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        .db-tab::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 60%;
          height: 2px;
          background: var(--color-primary);
          transition: transform 0.3s ease;
          border-radius: 2px;
        }
        .db-tab--active {
          color: var(--color-text);
        }
        .db-tab--active::after {
          transform: translateX(-50%) scaleX(1);
        }
        .db-tab:hover { color: var(--color-text); }
        .db-panel {
          padding: 2.5rem;
        }
        .db-panel-desc {
          font-family: var(--font-body);
          color: var(--color-text-muted);
          font-size: 0.92rem;
          margin-bottom: 1.5rem;
          font-style: italic;
        }
        .db-field-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        @media (max-width: 520px) {
          .db-field-row { flex-direction: column; }
        }
        .db-input {
          flex: 1;
          padding: 0.95rem 1.4rem;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
          outline: none;
          transition: all 0.3s ease;
        }
        .db-input::placeholder { color: var(--color-text-muted); font-style: italic; }
        .db-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(148,168,154,0.12); }
        .db-input--code {
          text-align: center;
          letter-spacing: 0.3em;
          font-size: 1.1rem;
          font-weight: 500;
          text-transform: uppercase;
        }
        .db-btn-primary {
          white-space: nowrap;
          padding: 0.95rem 2rem;
          background: var(--color-text);
          color: var(--color-background);
          border: none;
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .db-btn-primary:hover:not(:disabled) {
          background: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(148,168,154,0.4);
        }
        .db-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .db-spaces {
          animation: fadeUp 0.8s 0.2s ease both;
        }
        .db-spaces-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .db-spaces-label {
          font-family: var(--font-sans);
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .db-spaces-line {
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
        .db-rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .db-room-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 1.5rem;
          padding: 1.6rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          animation: fadeUp 0.5s ease both;
          position: relative;
          overflow: hidden;
        }
        .db-room-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top right, var(--color-secondary), transparent 70%);
          opacity: 0;
          transition: opacity 0.4s;
        }
        .db-room-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px -10px var(--color-shadow-lg);
        }
        .db-room-card:hover::before { opacity: 0.4; }
        .db-room-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .db-room-actions {
          display: flex; gap: 0.2rem;
          opacity: 0; transition: opacity 0.2s;
        }
        .db-room-card:hover .db-room-actions { opacity: 1; }
        .db-room-icon-btn {
          background: none; border: none; cursor: pointer;
          font-size: 0.8rem; filter: grayscale(1);
          opacity: 0.6; transition: all 0.2s;
          padding: 0.2rem;
        }
        .db-room-icon-btn:hover { filter: grayscale(0); opacity: 1; transform: scale(1.1); }
        .db-room-edit-row { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .db-room-edit-input { padding: 0.4rem 0.8rem; font-size: 0.9rem; flex: 1; }
        .db-room-num {
          font-family: var(--font-sans);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: var(--color-text-muted);
          opacity: 0.5;
        }
        .db-room-name-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }
        .db-room-name {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 1.15rem;
          font-weight: 400;
          color: var(--color-text);
          line-height: 1.3;
        }
        .db-room-owner-badge {
          font-family: var(--font-body);
          font-size: 0.72rem;
          color: var(--color-primary);
          font-style: italic;
          opacity: 0.8;
        }
        .db-room-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .db-room-code {
          font-family: var(--font-sans);
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          color: var(--color-text-muted);
          background: var(--color-background);
          padding: 0.3rem 0.7rem;
          border-radius: 100px;
          border: 1px solid var(--color-border);
        }
        .db-room-copy {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          padding: 0.35rem;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .db-room-copy:hover {
          background: var(--color-background);
          color: var(--color-text);
        }
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}