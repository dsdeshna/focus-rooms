// Focus Rooms — Type Definitions

export interface Profile {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly instagram: string | null;
  readonly linkedin: string | null;
  readonly github: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Room {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly created_by: string;
  readonly background_url: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  is_mic_on: boolean;
  joined_at: string;
  profile?: Profile;
}

export interface StickyNote {
  readonly id: string;
  readonly room_id: string;
  readonly user_id: string;
  readonly content: string;
  readonly position_x: number;
  readonly position_y: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface WhiteboardSave {
  id: string;
  room_id: string;
  user_id: string;
  snapshot_url: string;
  created_at: string;
}

// === STRATEGY PATTERN — Theme Types ===
export interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  shadow: string;
  glassBg: string;
  glassborder: string;
}

export interface Theme {
  name: string;
  emoji: string;
  colors: ThemeColors;
  isDark: boolean;
}

// === FACTORY PATTERN — Sound Types ===
export type NoiseType = 'white' | 'pink' | 'brown';
export type AmbientType = 'rain' | 'cafe' | 'forest' | 'ocean' | 'fireplace' | 'wind';

export interface SoundGenerator {
  start(): void;
  stop(): void;
  setVolume(volume: number): void;
  isPlaying(): boolean;
  getType(): string;
}

// === OBSERVER PATTERN — Event Types ===
export type RoomEventType =
  | 'screen-share-started'
  | 'screen-share-stopped'
  | 'whiteboard-opened'
  | 'whiteboard-closed'
  | 'mic-toggled'
  | 'participant-joined'
  | 'participant-left'
  | 'background-changed'
  | 'whiteboard-draw'
  | 'atmosphere-changed';

export interface RoomEvent {
  type: RoomEventType;
  userId: string;
  userName: string;
  connectionId?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// COMMAND PATTERN — Whiteboard Command Types
export interface DrawCommand {
  readonly id: string;
  readonly type: 'draw' | 'erase' | 'clear';
  readonly data: string; // serialized fabric object JSON
  readonly userId: string;
  readonly timestamp: number;
}

// Presence state for participants
export interface PresenceState {
  readonly user_id: string;
  readonly connectionId: string;
  readonly display_name: string;
  readonly is_mic_on: boolean;
  readonly is_screen_sharing: boolean;
  readonly online_at: string;
}

// Notification
export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: number;
}
