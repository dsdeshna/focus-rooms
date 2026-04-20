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

    const channel = this.supabase.channel(`webrtc:${this.roomCode}`);
    this.channel = channel;
    this.currentStatus = 'connecting';

    channel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }: { payload: SignalPayload }) => {
      if (payload.targetUserId === this.userId) {
        this.handleSignal(payload).catch((err) => {
          console.error('Failed to handle WebRTC signal:', err);
        });
      }
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        this.currentStatus = 'connected';
        const toFlush = [...this.pendingSignals];
        this.pendingSignals = [];
        toFlush.forEach(({ targetUserId, signal }) => this.sendSignal(targetUserId, signal));
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.currentStatus = 'errored';
      } else if (status === 'CLOSED') {
        this.currentStatus = 'disconnected';
      }
    });
  }

  /** Toggle microphone */
  async toggleMic(enable: boolean): Promise<MediaStream | null> {
    if (enable) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Add audio track to all existing peers and RENEGOTIATE
        for (const [peerId, pc] of Array.from(this.peers.entries())) {
          this.localStream?.getAudioTracks().forEach((track) => {
            pc.addTrack(track, this.localStream!);
          });
          await this.negotiate(peerId, pc);
        }
        return this.localStream;
      } catch (err: unknown) {
        console.error('Failed to get mic:', err);
        throw new Error(err instanceof Error ? err.message : 'Microphone access denied');
      }
    } else {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
        
        // Remove track from peers and renegotiate
        for (const [peerId, pc] of Array.from(this.peers.entries())) {
          pc.getSenders().forEach(sender => {
             if (sender.track?.kind === 'audio') {
               pc.removeTrack(sender);
             }
          });
          await this.negotiate(peerId, pc);
        }
        this.localStream = null;
      }
      return null;
    }
  }

  /** Create a peer connection for a remote user */
  async createPeerConnection(remoteUserId: string, initiator: boolean): Promise<void> {
    if (this.peers.has(remoteUserId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(remoteUserId, pc);

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      const type = 'audio';
      this.onRemoteStream(remoteUserId, stream, type);
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
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remoteUserId);
      }
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
      pc.close();
      this.peers.delete(userId);
      this.makingOffer.delete(userId);
      this.ignoredOffers.delete(userId);
      this.pendingIceCandidates.delete(userId);
      this.onRemoteStreamRemoved(userId, 'audio');
    }
  }

  private async negotiate(remoteUserId: string, pc: RTCPeerConnection): Promise<void> {
    if (pc.signalingState !== 'stable' || this.makingOffer.has(remoteUserId)) return;

    try {
      this.makingOffer.add(remoteUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (pc.localDescription) {
        this.sendSignal(remoteUserId, { type: 'offer', sdp: pc.localDescription.toJSON() });
      }
    } catch (err) {
      console.error('WebRTC negotiation failed:', err);
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
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  /** Handle incoming signaling messages */
  private async handleSignal(payload: SignalPayload): Promise<void> {
    const { fromUserId, signal } = payload;

    if (signal.type === 'offer') {
      await this.createPeerConnection(fromUserId, false);
      const pc = this.peers.get(fromUserId);
      if (!pc) return;

      const offerCollision = pc.signalingState !== 'stable' || this.makingOffer.has(fromUserId);
      const ignoreOffer = offerCollision && !this.isPolitePeer(fromUserId);

      if (ignoreOffer) {
        this.ignoredOffers.add(fromUserId);
        return;
      }

      this.ignoredOffers.delete(fromUserId);

      if (offerCollision) {
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
      const pc = this.peers.get(fromUserId);
      if (!pc) return;

      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`Ignored stale WebRTC answer from ${fromUserId} while ${pc.signalingState}.`);
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
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
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
    }).then((status) => {
      if (status !== 'ok') {
        console.error('Failed to send WebRTC signal:', status);
        this.pendingSignals.push({ targetUserId, signal });
      }
    }).catch((err) => {
      console.error('Failed to send WebRTC signal:', err);
      this.pendingSignals.push({ targetUserId, signal });
    });
  }

  /** Disconnect everything */
  disconnect(): void {
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
