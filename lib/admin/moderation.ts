import { supabase } from '../supabase';
import { Post, Comment } from '@/types/database';

export const adminModeration = {
  async getFlaggedContent(): Promise<(Post | Comment)[]> {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;
    if (commentsError) throw commentsError;

    return [...(posts || []), ...(comments || [])];
  },

  async getContentQueue(
    type?: 'post' | 'comment',
    status: 'pending' | 'flagged' = 'pending'
  ): Promise<(Post | Comment)[]> {
    if (type === 'post') {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    if (type === 'comment') {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // Get both posts and comments
    const [posts, comments] = await Promise.all([
      this.getContentQueue('post', status),
      this.getContentQueue('comment', status),
    ]);

    return [...posts, ...comments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async approveContent(id: string, type: 'post' | 'comment'): Promise<void> {
    const table = type === 'post' ? 'posts' : 'comments';
    const { error } = await supabase
      .from(table)
      .update({ status: 'published' })
      .eq('id', id);

    if (error) throw error;
  },

  async rejectContent(
    id: string, 
    type: 'post' | 'comment', 
    reason: string
  ): Promise<void> {
    const table = type === 'post' ? 'posts' : 'comments';
    const { error } = await supabase
      .from(table)
      .update({ 
        status: 'rejected',
        moderation_notes: reason 
      })
      .eq('id', id);

    if (error) throw error;
  },

  async suspendUser(userId: string, reason: string, duration?: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspension_ends_at: duration ? new Date(Date.now() + duration).toISOString() : null,
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async unsuspendUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspension_reason: null,
        suspension_ends_at: null,
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async getModerationStats(): Promise<{
    pending: number;
    flagged: number;
    approvedToday: number;
    rejectedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: pending },
      { count: flagged },
      { count: approvedToday },
      { count: rejectedToday },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'flagged'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', today.toISOString()),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('created_at', today.toISOString()),
    ]);

    return {
      pending: pending || 0,
      flagged: flagged || 0,
      approvedToday: approvedToday || 0,
      rejectedToday: rejectedToday || 0,
    };
  },
};