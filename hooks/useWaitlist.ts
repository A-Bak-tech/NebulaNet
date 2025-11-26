import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WaitlistEntry } from '@/types/database';

export const useWaitlist = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWaitlist = async (email: string, referralCode?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current waitlist count to determine position
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
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getWaitlistPosition = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('position, status')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const approveWaitlistEntry = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isLoading,
    error,
    joinWaitlist,
    getWaitlistPosition,
    approveWaitlistEntry,
  };
};