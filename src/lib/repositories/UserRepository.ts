// REPOSITORY PATTERN — UserRepository
// Abstracts all profile/user database operations.

import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';

export class UserRepository {
  private supabase = createClient();

  /** Get a user profile by ID */
  async findById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  }

  /** Create or update a user profile */
  async upsert(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert profile: ${error.message}`);
    return data as Profile;
  }

  /** Update display name */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update display name: ${error.message}`);
  }

  /** Update social links */
  async updateSocials(
    userId: string,
    socials: { instagram?: string; linkedin?: string; github?: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ ...socials, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update socials: ${error.message}`);
  }
}
