// ============================================================
// WebRTC Peer Manager
// Handles peer-to-peer connections for mic audio.
// Uses Supabase Realtime Broadcast for signaling (SDP & ICE exchange).
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

type WebRTCSignal =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit };

interface SignalPayload {
  fromUserId: string;
  targetUserId: string;
  signal: WebRTCSignal;
}

interface PendingSignal {
  targetUserId: string;
  signal: WebRTCSignal;
}

export class PeerManager {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private currentStatus: 'connecting' | 'connected' | 'errored' | 'disconnected' = 'disconnected';
  private pendingSignals: PendingSignal[] = [];
  private peers: Map<string, RTCPeerConnection> = new Map();
  private makingOffer: Set<string> = new Set();
  private ignoredOffers: Set<string> = new Set();
  private pendingIceCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private roomCode: string;
  private userId: string;
  private onRemoteStream: (userId: string, stream: MediaStream, type: 'audio') => void;
  private onRemoteStreamRemoved: (userId: string, type: 'audio') => void;

  constructor(
    roomCode: string,
    userId: string,
    onRemoteStream: (userId: string, stream: MediaStream, type: 'audio') => void,
    onRemoteStreamRemoved: (userId: string, type: 'audio') => void
  ) {
    this.roomCode = roomCode;
    this.userId = userId;
    this.onRemoteStream = onRemoteStream;
    this.onRemoteStreamRemoved = onRemoteStreamRemoved;
  }

  /** Initialize signaling channel */
  connect(): void {
    if (this.channel) return;

    console.log(`[WebRTC] Connecting signaling channel: webrtc:${this.roomCode}`);
    const channel = this.supabase.channel(`webrtc:${this.roomCode}`);
    this.channel = channel;
    this.currentStatus = 'connecting';

    channel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }: { payload: SignalPayload }) => {
      if (payload.targetUserId === this.userId) {
        this.handleSignal(payload).catch((err) => {
          console.error('[WebRTC] Signal handling error:', err);
        });
      }
    });

    channel.subscribe((status: string) => {
      console.log(`[WebRTC] Signaling status: ${status}`);
      if (status === 'SUBSCRIBED') {
        this.currentStatus = 'connected';
        if (this.pendingSignals.length > 0) {
          console.log(`[WebRTC] Flushing ${this.pendingSignals.length} pending signals`);
          const toFlush = [...this.pendingSignals];
          this.pendingSignals = [];
          toFlush.forEach(({ targetUserId, signal }) => this.sendSignal(targetUserId, signal));
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.currentStatus = 'errored';
      }
    });
  }

  /** Toggle microphone */
  async toggleMic(enable: boolean): Promise<MediaStream | null> {
    console.log(`[WebRTC] Toggling mic: ${enable ? 'ON' : 'OFF'}`);
    
    if (enable) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });

        // Update all existing peers
        for (const [peerId, pc] of Array.from(this.peers.entries())) {
          this.addLocalStreamToPeer(pc);
          await this.negotiate(peerId, pc);
        }
        return this.localStream;
      } catch (err: any) {
        console.error('[WebRTC] Microphone access error:', err);
        throw new Error(err.message || 'Microphone access denied');
      }
    } else {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
        
        // Remove tracks from all peers
        for (const [peerId, pc] of Array.from(this.peers.entries())) {
          pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'audio') {
              pc.removeTrack(sender);
            }
          });
          await this.negotiate(peerId, pc).catch(e => console.warn(`[WebRTC] Renegotiation after mute failed for ${peerId}:`, e));
        }
        this.localStream = null;
      }
      return null;
    }
  }

  private addLocalStreamToPeer(pc: RTCPeerConnection) {
    if (!this.localStream) return;
    
    const tracks = this.localStream.getAudioTracks();
    tracks.forEach((track) => {
      // Check if track is already being sent to prevent duplicates
      const alreadyExists = pc.getSenders().some(s => s.track === track);
      if (!alreadyExists) {
        pc.addTrack(track, this.localStream!);
      }
    });
  }

  /** Create a peer connection for a remote user */
  async createPeerConnection(remoteUserId: string, initiator: boolean): Promise<void> {
    if (this.peers.has(remoteUserId)) {
      console.log(`[WebRTC] Peer ${remoteUserId} already exists, skipping creation.`);
      return;
    }

    console.log(`[WebRTC] Creating connection to ${remoteUserId} (initiator: ${initiator})`);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(remoteUserId, pc);

    // Add local tracks if available
    this.addLocalStreamToPeer(pc);

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      console.log(`[WebRTC] Received remote audio stream from ${remoteUserId}`);
      this.onRemoteStream(remoteUserId, stream, 'audio');
    };

    // Send ICE candidates via Supabase signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(remoteUserId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${remoteUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remoteUserId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${remoteUserId}: ${pc.iceConnectionState}`);
    };

    // If initiator, create and send offer
    if (initiator) {
      await this.negotiate(remoteUserId, pc);
    }
  }

  /** Remove a peer connection */
  removePeer(userId: string): void {
    const pc = this.peers.get(userId);
    if (pc) {
      console.log(`[WebRTC] Removing peer ${userId}`);
      pc.close();
      this.peers.delete(userId);
      this.makingOffer.delete(userId);
      this.ignoredOffers.delete(userId);
      this.pendingIceCandidates.delete(userId);
      this.onRemoteStreamRemoved(userId, 'audio');
    }
  }

  private async negotiate(remoteUserId: string, pc: RTCPeerConnection): Promise<void> {
    if (this.makingOffer.has(remoteUserId)) return;

    try {
      this.makingOffer.add(remoteUserId);
      console.log(`[WebRTC] Negotiating with ${remoteUserId}...`);
      
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') {
        // If we are in the middle of receiving an offer, don't try to send one yet
        return;
      }
      
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        this.sendSignal(remoteUserId, { type: 'offer', sdp: pc.localDescription.toJSON() });
      }
    } catch (err) {
      console.error(`[WebRTC] Negotiation failed for ${remoteUserId}:`, err);
    } finally {
      this.makingOffer.delete(remoteUserId);
    }
  }

  private isPolitePeer(remoteUserId: string): boolean {
    return this.userId.localeCompare(remoteUserId) > 0;
  }

  private async flushPendingIceCandidates(remoteUserId: string, pc: RTCPeerConnection): Promise<void> {
    const candidates = this.pendingIceCandidates.get(remoteUserId);
    if (!candidates?.length || !pc.remoteDescription) return;

    this.pendingIceCandidates.delete(remoteUserId);
    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn(`[WebRTC] Failed to add ICE candidate for ${remoteUserId}:`, e);
      }
    }
  }

  /** Handle incoming signaling messages */
  private async handleSignal(payload: SignalPayload): Promise<void> {
    const { fromUserId, signal } = payload;

    if (signal.type === 'offer') {
      console.log(`[WebRTC] Received offer from ${fromUserId}`);
      await this.createPeerConnection(fromUserId, false);
      const pc = this.peers.get(fromUserId);
      if (!pc) return;

      const offerCollision = pc.signalingState !== 'stable' || this.makingOffer.has(fromUserId);
      const ignoreOffer = offerCollision && !this.isPolitePeer(fromUserId);

      if (ignoreOffer) {
        console.warn(`[WebRTC] Ignoring offer collision from ${fromUserId} (impolite)`);
        this.ignoredOffers.add(fromUserId);
        return;
      }

      this.ignoredOffers.delete(fromUserId);

      if (offerCollision) {
        console.log(`[WebRTC] Rolling back due to collision with ${fromUserId}`);
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      await this.flushPendingIceCandidates(fromUserId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (pc.localDescription) {
        this.sendSignal(fromUserId, { type: 'answer', sdp: pc.localDescription.toJSON() });
      }
    } else if (signal.type === 'answer') {
      console.log(`[WebRTC] Received answer from ${fromUserId}`);
      const pc = this.peers.get(fromUserId);
      if (!pc) return;

      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`[WebRTC] Ignored stale answer from ${fromUserId} while ${pc.signalingState}`);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      await this.flushPendingIceCandidates(fromUserId, pc);
    } else if (signal.type === 'ice-candidate') {
      const pc = this.peers.get(fromUserId);
      if (!pc || !signal.candidate || this.ignoredOffers.has(fromUserId)) return;

      if (!pc.remoteDescription) {
        const pending = this.pendingIceCandidates.get(fromUserId) || [];
        pending.push(signal.candidate);
        this.pendingIceCandidates.set(fromUserId, pending);
      } else {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn(`[WebRTC] Failed to add ICE candidate from ${fromUserId}:`, e);
        }
      }
    }
  }

  /** Send a signaling message via Supabase Broadcast */
  private sendSignal(targetUserId: string, signal: WebRTCSignal): void {
    if (!this.channel || this.currentStatus !== 'connected') {
      this.pendingSignals.push({ targetUserId, signal });
      return;
    }

    this.channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: {
        fromUserId: this.userId,
        targetUserId,
        signal,
      },
    }).catch((err) => {
      console.error('[WebRTC] Signaling broadcast failed:', err);
      this.pendingSignals.push({ targetUserId, signal });
    });
  }

  /** Disconnect everything */
  disconnect(): void {
    console.log('[WebRTC] Disconnecting PeerManager...');
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.makingOffer.clear();
    this.ignoredOffers.clear();
    this.pendingIceCandidates.clear();
    this.pendingSignals = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentStatus = 'disconnected';
  }
}
