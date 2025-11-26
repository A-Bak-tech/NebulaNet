import { supabase } from './supabase';
import { Post, Comment } from '@/types/database';

export const posts = {
  async getFeed(page = 0, limit = 20): Promise<Post[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(*)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data || [];
  },

  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'user'>) {
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async likePost(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: userId }]);

    if (error) throw error;
  },

  async unlikePost(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'user'>) {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};