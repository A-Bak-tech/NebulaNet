import { supabase } from './supabase';
import { WaitlistEntry } from '@/types/database';

export const waitlist = {
  async join(email: string, referralCode?: string): Promise<WaitlistEntry> {
    // Get current position
    const { count } = await supabase
      .from('waitlist_entries')
      .select('*', { count: 'exact', head: true });

    const position = (count || 0) + 1;

    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert([
        {
          email,
          position,
          referred_by: referralCode || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPosition(email: string): Promise<{ position: number; status: string } | null> {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('position, status')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  },

  async getEntries(
    status?: 'pending' | 'approved' | 'rejected',
    page = 0,
    limit = 50
  ): Promise<WaitlistEntry[]> {
    let query = supabase
      .from('waitlist_entries')
      .select('*')
      .order('position', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await query.range(from, to);

    if (error) throw error;
    return data || [];
  },

  async approveEntry(id: string): Promise<WaitlistEntry> {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectEntry(id: string): Promise<WaitlistEntry> {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .update({
        status: 'rejected',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};