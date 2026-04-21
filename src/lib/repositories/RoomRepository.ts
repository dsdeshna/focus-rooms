// Room Repository
// RoomRepository abstracts all database operations
// for the "rooms" table behind a clean interface. The rest of the
// app never directly calls Supabase queries for rooms — it always
// goes through this repository. This decouples data access from
// business logic, making it easy to swap the data source.

import { createClient } from '@/lib/supabase/client';
import { Room } from '@/types';
import { generateRoomCode } from '@/lib/utils';

export class RoomRepository {
  private readonly supabase = createClient();

  /** Create a new room with a unique code */
  async create(name: string, createdBy: string): Promise<Room> {
    const code = generateRoomCode();

    const { data, error } = await this.supabase
      .from('rooms')
      .insert({ name, code, created_by: createdBy })
      .select()
      .single();

    if (error) throw new Error(`Failed to create room: ${error.message}`);
    return data as Room;
  }

  /** Find a room by its shareable code */
  async findByCode(code: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error("findByCode error:", error.message);
      return null;
    }
    return data as Room;
  }

  /** Get a room by ID */
  async findById(id: string): Promise<Room | null> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Room;
  }

  /** Get all rooms created by or joined by the user */
  async getSavedRooms(userId: string): Promise<Room[]> {
    const { data: createdRooms } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('created_by', userId)
      .eq('is_active', true);

    const { data: joinedData } = await this.supabase
      .from('room_participants')
      .select('rooms(*)')
      .eq('user_id', userId);

    const roomsMap = new Map<string, Room>();
    
    if (createdRooms) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdRooms.forEach((r: any) => roomsMap.set(r.id, r as Room));
    }
    
    if (joinedData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      joinedData.forEach((row: any) => {
        if (row.rooms?.is_active) {
          roomsMap.set(row.rooms.id, row.rooms as Room);
        }
      });
    }

    return Array.from(roomsMap.values()).sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  async updateBackground(roomId: string, backgroundUrl: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('rooms')
        .update({ 
          background_url: backgroundUrl 
        })
        .eq('id', roomId);

      if (error) {
        console.error('❌ updateBackground failed:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ updateBackground exception:', err);
      return false;
    }
  }

  /** Join a room (add participant) */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('room_participants')
      .upsert({ room_id: roomId, user_id: userId }, { onConflict: 'room_id,user_id' });

    if (error) throw new Error(`Failed to join room: ${error.message}`);
  }

  /** Leave a room (update mic status to false but do NOT delete so it stays in "Your Spaces") */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('room_participants')
      .update({ is_mic_on: false })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to leave room: ${error.message}`);
  }

  /** Permanently remove a room from a user's dashboard (unjoin) */
  async unjoinRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to unjoin room: ${error.message}`);
  }

  /** Update mic status */
  async updateMicStatus(roomId: string, userId: string, isMicOn: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('room_participants')
      .update({ is_mic_on: isMicOn })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to update mic status: ${error.message}`);
  }

  /** Get participants of a room */
  async getParticipants(roomId: string): Promise<Array<{ user_id: string; is_mic_on: boolean; profile: { display_name: string; avatar_url: string | null } }>> {
    const { data, error } = await this.supabase
      .from('room_participants')
      .select('user_id, is_mic_on, profiles(display_name, avatar_url)')
      .eq('room_id', roomId);

    if (error) throw new Error(`Failed to get participants: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((p: any) => ({
      user_id: p.user_id,
      is_mic_on: p.is_mic_on,
      profile: p.profiles || { display_name: 'Anonymous', avatar_url: null },
    }));
  }

  /** Deactivate a room */
  async deactivate(roomId: string): Promise<void> {
    const { error } = await this.supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId);

    if (error) throw new Error(`Failed to deactivate room: ${error.message}`);
  }

  /** Rename a room */
  async rename(roomId: string, newName: string): Promise<void> {
    const { error } = await this.supabase
      .from('rooms')
      .update({ name: newName })
      .eq('id', roomId);

    if (error) throw new Error(`Failed to rename room: ${error.message}`);
  }

  /** Permanently delete a room and its associated data */
  async delete(roomId: string): Promise<void> {
    // Manually delete dependencies first in case constraints don't cascade
    await this.supabase.from('room_participants').delete().eq('room_id', roomId);
    await this.supabase.from('room_notes').delete().eq('room_id', roomId);
    await this.supabase.from('whiteboard_state').delete().eq('room_id', roomId);

    const { error } = await this.supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw new Error(`Failed to delete room: ${error.message}`);
  }
}
