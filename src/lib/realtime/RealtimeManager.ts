// OBSERVER PATTERN IMPLEMENTED HERE
// EVENT-DRIVEN ARCHITECTURE (CLOUD PATTERN)
// Explanation: The RealtimeManager is the Subject in the Observer
// Pattern. It subscribes to a Supabase Realtime channel (which uses
// Pub/Sub under the hood — the Event-Driven Cloud Pattern) and
// notifies registered observer callbacks whenever events occur.
// 
// Components register as observers by calling subscribe() with a
// callback. When any participant broadcasts an event (screen share,
// whiteboard update, mic toggle, etc.), ALL observers are notified.
// This decouples event producers from consumers.

import { createClient } from '@/lib/supabase/client';
import { RoomEvent, PresenceState } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventObserver = (event: RoomEvent) => void;
type PresenceObserver = (presences: PresenceState[]) => void;
type StatusObserver = (status: 'connecting' | 'connected' | 'errored' | 'disconnected') => void;
type PresencePayload = Partial<PresenceState>;

function unwrapBroadcastPayload(message: unknown): RoomEvent | null {
  if (!message || typeof message !== 'object') return null;

  const maybeEnvelope = message as { payload?: unknown };
  const candidate =
    maybeEnvelope.payload && typeof maybeEnvelope.payload === 'object'
      ? maybeEnvelope.payload
      : message;

  if (!candidate || typeof candidate !== 'object') return null;
  const event = candidate as Partial<RoomEvent>;

  if (typeof event.type !== 'string' || typeof event.userId !== 'string') {
    return null;
  }

  return event as RoomEvent;
}

function normalizePresenceState(state: Record<string, unknown[]>): PresenceState[] {
  // Use connectionId as the unique key instead of user_id 
  // to correctly track multiple tabs from the same user.
  const presencesMap = new Map<string, PresenceState>();

  (Object.values(state).flat() as PresencePayload[]).forEach((presence) => {
    if (typeof presence.connectionId !== 'string') return;

    presencesMap.set(presence.connectionId, {
      user_id: presence.user_id || 'unknown',
      connectionId: presence.connectionId,
      display_name: presence.display_name || 'User',
      is_mic_on: Boolean(presence.is_mic_on),
      is_screen_sharing: Boolean(presence.is_screen_sharing),
      online_at: presence.online_at || new Date().toISOString(),
    });
  });

  return Array.from(presencesMap.values());
}

export class RealtimeManager {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private roomCode: string;
  private pendingBroadcasts: RoomEvent[] = [];
  private currentStatus: 'connecting' | 'connected' | 'errored' | 'disconnected' = 'disconnected';
  public readonly connectionId: string;

  // OBSERVER: List of registered observer callbacks
  private eventObservers: Map<string, EventObserver> = new Map();
  private presenceObservers: Map<string, PresenceObserver> = new Map();
  private statusObservers: Map<string, StatusObserver> = new Map();

  constructor(roomCode: string) {
    this.roomCode = roomCode;
    this.connectionId = Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  /**
   * OBSERVER PATTERN: subscribe() — Register an observer
   * Components call this to receive real-time event notifications.
   */
  subscribeToEvents(observerId: string, callback: EventObserver): void {
    this.eventObservers.set(observerId, callback);
  }

  /**
   * OBSERVER PATTERN: unsubscribe() — Remove an observer
   */
  unsubscribeFromEvents(observerId: string): void {
    this.eventObservers.delete(observerId);
  }

  /**
   * Subscribe to presence updates (participant join/leave/status)
   */
  subscribeToPresence(observerId: string, callback: PresenceObserver): void {
    this.presenceObservers.set(observerId, callback);
  }

  unsubscribeFromPresence(observerId: string): void {
    this.presenceObservers.delete(observerId);
  }

  /**
   * Register an observer for connection status changes
   */
  subscribeToStatus(observerId: string, callback: StatusObserver): void {
    this.statusObservers.set(observerId, callback);
    callback(this.currentStatus);
  }

  unsubscribeFromStatus(observerId: string): void {
    this.statusObservers.delete(observerId);
  }

  /**
   * EVENT-DRIVEN ARCHITECTURE: Connect to the room channel
   * Uses Supabase Realtime Broadcast (Pub/Sub under the hood)
   */
  connect(userPresence: PresenceState): void {
    if (this.channel) return;

    this.updateStatus('connecting');
    console.log(`[Realtime] Connecting to room:${this.roomCode}...`);

    const channel = this.supabase.channel(`room:${this.roomCode}`, {
      config: { presence: { key: userPresence.user_id } },
    });
    this.channel = channel;

    // EVENT-DRIVEN: Listen for broadcast events (Pub/Sub)
    channel.on('broadcast', { event: 'room-event' }, (message: unknown) => {
      const event = unwrapBroadcastPayload(message);
      if (!event) {
        console.warn('[Realtime] Ignored malformed event:', message);
        return;
      }
      this.notifyEventObservers(event);
    });

    // EVENT-DRIVEN: Listen for presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, unknown[]> | null;
      const normalized = normalizePresenceState(state || {});
      // Presence sync log removed for production cleanliness
      this.notifyPresenceObservers(normalized);
    });

    channel.subscribe(async (status: string) => {
      console.log(`[Realtime] Subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        this.updateStatus('connected');
        
        // Track presence immediately
        const { error } = await channel.track(userPresence);
        if (error) {
          console.error('[Realtime] Failed to track presence:', error);
        } else {
          console.log('[Realtime] Presence tracked successfully');
        }
        
        // Flush any broadcasts sent while connecting
        this.flushPendingBroadcasts();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Realtime] Connection failed with status: ${status}`);
        this.updateStatus('errored');
      }
    });

    // Handle visibility change for mobile (re-track when tab becomes active)
    if (typeof window !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && this.channel && this.currentStatus === 'connected') {
          console.log('[Realtime] Tab visible, updating presence...');
          this.channel.track(userPresence).catch(err => console.error('[Realtime] Re-track failed:', err));
        }
      };
      window.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }

  private flushPendingBroadcasts(): void {
    if (!this.channel || this.currentStatus !== 'connected') return;
    
    if (this.pendingBroadcasts.length > 0) {
      console.log(`[Realtime] Flushing ${this.pendingBroadcasts.length} pending broadcasts`);
      const toFlush = [...this.pendingBroadcasts];
      this.pendingBroadcasts = [];
      toFlush.forEach((ev) => this.broadcastEvent(ev));
    }
  }

  /**
   * EVENT-DRIVEN: Broadcast an event to all subscribers
   * This is the "publish" side of Pub/Sub.
   */
  broadcastEvent(event: RoomEvent): void {
    if (!this.channel || this.currentStatus !== 'connected') {
      this.pendingBroadcasts.push(event);
      return;
    }
    
    // Inject connection ID
    const eventWithId = { ...event, connectionId: this.connectionId };
    
    this.channel.send({
      type: 'broadcast',
      event: 'room-event',
      payload: eventWithId,
    }).then((status) => {
      if (status !== 'ok') {
        console.error('Failed to broadcast event:', status);
        this.pendingBroadcasts.push(event);
      }
    }).catch(err => {
      console.error('Failed to broadcast event:', err);
      this.pendingBroadcasts.push(event);
    });
  }

  /**
   * Update own presence state (e.g., mic toggle)
   */
  async updatePresence(updates: Partial<PresenceState>): Promise<void> {
    if (!this.channel) return;
    await this.channel.track(updates as PresenceState);
  }

  /**
   * Get current presence state
   */
  getPresences(): PresenceState[] {
    if (!this.channel) return [];
    const state = this.channel.presenceState() as Record<string, unknown[]>;
    return normalizePresenceState(state);
  }

  /**
   * Disconnect from the room channel
   */
  disconnect(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.updateStatus('disconnected');
    this.eventObservers.clear();
    this.presenceObservers.clear();
    this.statusObservers.clear();
  }

  /**
   * Internal status update
   */
  private updateStatus(status: 'connecting' | 'connected' | 'errored' | 'disconnected'): void {
    this.currentStatus = status;
    this.statusObservers.forEach((callback) => {
      try {
        callback(status);
      } catch (err) {
        console.error('Error in status observer:', err);
      }
    });
  }

  /**
   * OBSERVER: Notify all event observers
   * This is the "notify" method of the Observer Pattern.
   */
  private notifyEventObservers(event: RoomEvent): void {
    this.eventObservers.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in event observer:', err);
      }
    });
  }

  /**
   * OBSERVER: Notify all presence observers
   */
  private notifyPresenceObservers(presences: PresenceState[]): void {
    this.presenceObservers.forEach((callback) => {
      try {
        callback(presences);
      } catch (err) {
        console.error('Error in presence observer:', err);
      }
    });
  }
}
