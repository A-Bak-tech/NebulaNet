// File: /lib/comments.ts
import { supabase } from './supabase';
import { Comment, CommentInput, CommentFilters } from '../types/comments';

export const comments = {
  // Get comments for a post
  async getComments(
    postId: string, 
    filters: CommentFilters = {}
  ): Promise<Comment[]> {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified),
          replies:comments!parent_id(
            *,
            user:users(id, username, display_name, avatar_url, is_verified)
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null) // Only top-level comments
        .eq('is_deleted', false);

      // Apply sorting
      switch (filters.sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        default: // 'newest'
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  // Get comment by ID
  async getComment(commentId: string): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('id', commentId)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      return null;
    }
  },

  // Get replies for a comment
  async getReplies(commentId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified)
        `)
        .eq('parent_id', commentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  },

  // Add a comment
  async addComment(
    postId: string, 
    comment: CommentInput,
    userId: string
  ): Promise<Comment> {
    try {
      // Check if post exists and allows comments
      const { data: post } = await supabase
        .from('posts')
        .select('id, can_comment')
        .eq('id', postId)
        .single();

      if (!post) throw new Error('Post not found');
      if (!post.can_comment) throw new Error('Comments are disabled for this post');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          parent_id: comment.parent_id,
          content: comment.content,
          media_urls: comment.media_urls,
        })
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified)
        `)
        .single();

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('increment_post_comments', { post_id: postId });

      // Update parent comment replies count if it's a reply
      if (comment.parent_id) {
        await supabase.rpc('increment_comment_replies', { comment_id: comment.parent_id });
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Like a comment
  async likeComment(commentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
        });

      if (error) {
        if (error.code === '23505') { // Unique violation (already liked)
          return;
        }
        throw error;
      }

      // Update comment likes count
      await supabase.rpc('increment_comment_likes', { comment_id: commentId });
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },

  // Unlike a comment
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update comment likes count
      await supabase.rpc('decrement_comment_likes', { comment_id: commentId });
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  },

  // Edit a comment
  async editComment(
    commentId: string, 
    content: string,
    userId: string
  ): Promise<Comment> {
    try {
      // Verify ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment) throw new Error('Comment not found');
      if (comment.user_id !== userId) throw new Error('Not authorized');

      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  },

  // Delete a comment (soft delete)
  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Verify ownership or admin
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, post_id, parent_id')
        .eq('id', commentId)
        .single();

      if (!comment) throw new Error('Comment not found');
      
      // Check if user is comment owner or post owner
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', comment.post_id)
        .single();

      const isCommentOwner = comment.user_id === userId;
      const isPostOwner = post?.user_id === userId;
      
      if (!isCommentOwner && !isPostOwner) {
        throw new Error('Not authorized');
      }

      // Soft delete
      const { error } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          content: '[deleted]',
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('decrement_post_comments', { post_id: comment.post_id });

      // Update parent comment replies count if it's a reply
      if (comment.parent_id) {
        await supabase.rpc('decrement_comment_replies', { comment_id: comment.parent_id });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // Check if user liked a comment
  async checkLiked(commentId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking like:', error);
      return false;
    }
  },

  // Subscribe to new comments
  subscribeToComments(postId: string, callback: (comment: Comment) => void) {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const comment = await this.getComment(payload.new.id);
          if (comment) callback(comment);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Subscribe to comment updates (likes, edits, deletes)
  subscribeToCommentUpdates(postId: string, callback: (comment: Comment) => void) {
    const channel = supabase
      .channel(`comment-updates-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const comment = await this.getComment(payload.new.id);
          if (comment) callback(comment);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};