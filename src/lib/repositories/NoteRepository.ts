// ============================================================
// === REPOSITORY PATTERN — NoteRepository ===
// Abstracts all sticky note database operations.
// Notes are personal (visible only to the owner).
// ============================================================

import { createClient } from '@/lib/supabase/client';
import { StickyNote } from '@/types';

export class NoteRepository {
  private supabase = createClient();

  /** Get all notes for a user in a room */
  async findByUserAndRoom(userId: string, roomId: string): Promise<StickyNote[]> {
    const { data, error } = await this.supabase
      .from('sticky_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch notes: ${error.message}`);
    return (data as StickyNote[]) || [];
  }

  /** Create a new sticky note */
  async create(roomId: string, userId: string, content: string = ''): Promise<StickyNote> {
    const { data, error } = await this.supabase
      .from('sticky_notes')
      .insert({ room_id: roomId, user_id: userId, content })
      .select()
      .single();

    if (error) throw new Error(`Failed to create note: ${error.message}`);
    return data as StickyNote;
  }

  /** Update a sticky note's content */
  async updateContent(noteId: string, content: string): Promise<void> {
    const { error } = await this.supabase
      .from('sticky_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', noteId);

    if (error) throw new Error(`Failed to update note: ${error.message}`);
  }

  /** Update a sticky note's position */
  async updatePosition(noteId: string, x: number, y: number): Promise<void> {
    const { error } = await this.supabase
      .from('sticky_notes')
      .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
      .eq('id', noteId);

    if (error) throw new Error(`Failed to update note position: ${error.message}`);
  }

  /** Delete a sticky note */
  async delete(noteId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sticky_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw new Error(`Failed to delete note: ${error.message}`);
  }
}
