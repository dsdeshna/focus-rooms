// Focus Rooms — Type Definitions

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  instagram: string | null;
  linkedin: string | null;
  github: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  created_by: string;
  background_url: string | null;
  is_active: boolean;
  created_at: string;
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
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
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
  id: string;
  type: 'draw' | 'erase' | 'clear';
  data: string; // serialized fabric object JSON
  userId: string;
  timestamp: number;
}

// Presence state for participants
export interface PresenceState {
  user_id: string;
  connectionId: string;
  display_name: string;
  is_mic_on: boolean;
  is_screen_sharing: boolean;
  online_at: string;
}

// Notification
export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: number;
}
