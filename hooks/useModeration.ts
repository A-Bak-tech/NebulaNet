import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useModeration = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getPendingContent = async (type?: 'post' | 'comment') => {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'pending');

      if (type === 'comment') {
        query = supabase
          .from('comments')
          .select('*')
          .eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending content:', error);
      throw error;
    }
  };

  const approveContent = async (id: string, type: 'post' | 'comment') => {
    setIsLoading(true);
    try {
      const table = type === 'post' ? 'posts' : 'comments';
      const { data, error } = await supabase
        .from(table)
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error approving content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectContent = async (id: string, type: 'post' | 'comment', reason: string) => {
    setIsLoading(true);
    try {
      const table = type === 'post' ? 'posts' : 'comments';
      const { data, error } = await supabase
        .from(table)
        .update({ 
          status: 'rejected',
          moderation_notes: reason 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const flagContent = async (id: string, type: 'post' | 'comment', reason: string) => {
    try {
      const table = type === 'post' ? 'posts' : 'comments';
      const { data, error } = await supabase
        .from(table)
        .update({ 
          status: 'flagged',
          flags: [reason] 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error flagging content:', error);
      throw error;
    }
  };

  return {
    isLoading,
    getPendingContent,
    approveContent,
    rejectContent,
    flagContent,
  };
};