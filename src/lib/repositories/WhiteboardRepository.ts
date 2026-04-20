// ============================================================
// === REPOSITORY PATTERN — WhiteboardRepository ===
// Abstracts whiteboard snapshot save/load operations.
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { WhiteboardSave } from '@/types';

export class WhiteboardRepository {
  private supabase = createClient();

  /** Save a whiteboard snapshot (as data URL stored in table) */
  async saveSnapshot(roomId: string, userId: string, dataUrl: string): Promise<WhiteboardSave> {
    const { data, error } = await this.supabase
      .from('whiteboard_saves')
      .insert({ room_id: roomId, user_id: userId, snapshot_url: dataUrl })
      .select()
      .single();

    if (error) throw new Error(`Failed to save whiteboard: ${error.message}`);
    return data as WhiteboardSave;
  }

  /** Get all whiteboard saves for a user */
  async findByUser(userId: string): Promise<WhiteboardSave[]> {
    const { data, error } = await this.supabase
      .from('whiteboard_saves')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch whiteboard saves: ${error.message}`);
    return (data as WhiteboardSave[]) || [];
  }

  /** Get saves for a specific room */
  async findByRoom(roomId: string): Promise<WhiteboardSave[]> {
    const { data, error } = await this.supabase
      .from('whiteboard_saves')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch room whiteboard saves: ${error.message}`);
    return (data as WhiteboardSave[]) || [];
  }
}
