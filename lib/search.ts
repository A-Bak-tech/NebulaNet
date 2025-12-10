// File: /lib/search.ts
import { supabase } from './supabase';
import { 
  SearchType, 
  SearchFilters, 
  SearchResponse, 
  TrendingTopic,
  SearchSuggestion
} from '../types/search';

export const searchService = {
  // ==================== SEARCH ====================
  
  /**
   * Perform a search with filters
   */
  search: async (
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResponse> => {
    try {
      if (!query.trim()) {
        return {
          query,
          results: [],
          total: 0,
          has_more: false,
          suggestions: [],
        };
      }
      
      const { type = 'all', sort = 'relevance', timeRange = 'all' } = filters;
      const from = (page - 1) * limit;
      
      let results: any[] = [];
      let total = 0;
      let has_more = false;
      
      // Perform different searches based on type
      if (type === 'all' || type === 'posts') {
        const posts = await searchPosts(query, filters, from, limit);
        results.push(...posts.map(post => ({
          type: 'post' as const,
          id: post.id,
          relevance: calculateRelevance(post, query),
          data: post,
        })));
      }
      
      if (type === 'all' || type === 'users') {
        const users = await searchUsers(query, filters, from, limit);
        results.push(...users.map(user => ({
          type: 'user' as const,
          id: user.id,
          relevance: calculateRelevance(user, query),
          data: user,
        })));
      }
      
      if (type === 'all' || type === 'tags') {
        const tags = await searchTags(query, filters, from, limit);
        results.push(...tags.map(tag => ({
          type: 'tag' as const,
          id: tag.name,
          relevance: tag.count,
          data: tag,
        })));
      }
      
      // Sort results
      if (sort === 'relevance') {
        results.sort((a, b) => b.relevance - a.relevance);
      } else if (sort === 'latest') {
        results.sort((a, b) => 
          new Date(b.data.created_at || b.data.created_at).getTime() - 
          new Date(a.data.created_at || a.data.created_at).getTime()
        );
      } else if (sort === 'popular') {
        results.sort((a, b) => {
          const aScore = (a.data.likes_count || 0) + (a.data.echoes_count || 0) + (a.data.followers_count || 0);
          const bScore = (b.data.likes_count || 0) + (b.data.echoes_count || 0) + (b.data.followers_count || 0);
          return bScore - aScore;
        });
      }
      
      // Apply time filter
      if (timeRange !== 'all') {
        const timeAgo = getTimeAgo(timeRange);
        results = results.filter(result => {
          const createdAt = result.data.created_at || result.data.created_at;
          return new Date(createdAt) >= timeAgo;
        });
      }
      
      // Get suggestions
      const suggestions = await getSearchSuggestions(query);
      
      // Get trending topics
      const trending_topics = await this.getTrendingTopics();
      
      return {
        query,
        results: results.slice(0, limit),
        total: results.length,
        has_more: results.length > limit,
        suggestions,
        trending_topics,
      };
    } catch (error: any) {
      console.error('Search error:', error);
      throw new Error(error.message || 'Failed to perform search');
    }
  },
  
  /**
   * Search posts
   */
  searchPosts: async (
    query: string,
    filters: SearchFilters = {},
    from: number = 0,
    limit: number = 20
  ): Promise<any[]> => {
    try {
      let searchQuery = supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified),
          media:post_media(*)
        `)
        .eq('is_deleted', false)
        .or(`content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.mediaOnly) {
        searchQuery = searchQuery.not('media_urls', 'is', null);
      }
      
      if (filters.minLikes) {
        searchQuery = searchQuery.gte('likes_count', filters.minLikes);
      }
      
      // Apply time range
      if (filters.timeRange && filters.timeRange !== 'all') {
        const timeAgo = getTimeAgo(filters.timeRange);
        searchQuery = searchQuery.gte('created_at', timeAgo.toISOString());
      }
      
      const { data, error } = await searchQuery.range(from, from + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search posts error:', error);
      return [];
    }
  },
  
  /**
   * Search users
   */
  searchUsers: async (
    query: string,
    filters: SearchFilters = {},
    from: number = 0,
    limit: number = 20
  ): Promise<any[]> => {
    try {
      let searchQuery = supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('followers_count', { ascending: false });
      
      // Apply filters
      if (filters.verifiedOnly) {
        searchQuery = searchQuery.eq('is_verified', true);
      }
      
      const { data, error } = await searchQuery.range(from, from + limit - 1);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  },
  
  /**
   * Search tags
   */
  searchTags: async (
    query: string,
    filters: SearchFilters = {},
    from: number = 0,
    limit: number = 20
  ): Promise<any[]> => {
    try {
      // Get posts with matching tags
      const { data, error } = await supabase
        .from('posts')
        .select('tags, id, created_at')
        .contains('tags', [query])
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);
      
      if (error) throw error;
      
      // Aggregate tag data
      const tagMap = new Map<string, { count: number, latest: string, posts: any[] }>();
      
      data?.forEach(post => {
        post.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            const existing = tagMap.get(tag) || { count: 0, latest: '', posts: [] };
            tagMap.set(tag, {
              count: existing.count + 1,
              latest: post.created_at > existing.latest ? post.created_at : existing.latest,
              posts: [...existing.posts, post.id],
            });
          }
        });
      });
      
      // Convert to array
      return Array.from(tagMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      }));
    } catch (error) {
      console.error('Search tags error:', error);
      return [];
    }
  },
  
  // ==================== SUGGESTIONS ====================
  
  /**
   * Get search suggestions
   */
  getSearchSuggestions: async (query: string): Promise<string[]> => {
    try {
      if (!query.trim()) return [];
      
      // Get user suggestions
      const { data: users } = await supabase
        .from('users')
        .select('username, display_name')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);
      
      // Get tag suggestions
      const { data: posts } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null)
        .limit(20);
      
      // Extract unique tags
      const tagSet = new Set<string>();
      posts?.forEach(post => {
        post.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tagSet.add(`#${tag}`);
          }
        });
      });
      
      // Combine suggestions
      const suggestions = [
        ...(users?.map(u => `@${u.username}`) || []),
        ...Array.from(tagSet),
      ];
      
      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Get suggestions error:', error);
      return [];
    }
  },
  
  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions: async (query: string): Promise<SearchSuggestion[]> => {
    try {
      if (!query.trim()) return [];
      
      const suggestions: SearchSuggestion[] = [];
      
      // User suggestions
      const { data: users } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, is_verified, followers_count')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);
      
      users?.forEach(user => {
        suggestions.push({
          id: user.id,
          type: 'user',
          text: user.display_name || user.username,
          subtitle: `@${user.username}`,
          image: user.avatar_url,
          metadata: {
            is_verified: user.is_verified,
            followers: user.followers_count,
          },
        });
      });
      
      // Tag suggestions
      const { data: tagsData } = await supabase
        .rpc('search_tags', { search_query: query, limit_count: 5 });
      
      tagsData?.forEach((tag: any) => {
        suggestions.push({
          id: tag.name,
          type: 'tag',
          text: `#${tag.name}`,
          subtitle: `${tag.count} posts`,
          metadata: {
            count: tag.count,
          },
        });
      });
      
      return suggestions;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  },
  
  // ==================== TRENDING ====================
  
  /**
   * Get trending topics
   */
  getTrendingTopics: async (limit: number = 10): Promise<TrendingTopic[]> => {
    try {
      const { data, error } = await supabase.rpc('get_trending_topics', {
        hours: 24,
        limit_count: limit,
      });
      
      if (error) throw error;
      
      // Calculate growth
      const topicsWithGrowth = await Promise.all(
        (data || []).map(async (topic: any) => {
          const previousCount = await getPreviousTagCount(topic.tag, 24);
          const growth = previousCount > 0 
            ? ((topic.count - previousCount) / previousCount) * 100 
            : 100;
          
          return {
            ...topic,
            growth: Math.round(growth),
          };
        })
      );
      
      return topicsWithGrowth;
    } catch (error) {
      console.error('Get trending topics error:', error);
      return [];
    }
  },
  
  /**
   * Get trending posts
   */
  getTrendingPosts: async (limit: number = 20): Promise<any[]> => {
    try {
      const { data, error } = await supabase.rpc('get_trending_posts', {
        hours: 24,
        limit_count: limit,
      });
      
      if (error) throw error;
      
      // Fetch full post data
      const postIds = data.map((p: any) => p.id);
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, username, display_name, avatar_url, is_verified),
          media:post_media(*)
        `)
        .in('id', postIds)
        .eq('is_deleted', false);
      
      // Maintain order from trending query
      const orderedPosts = postIds
        .map((id: string) => posts?.find(p => p.id === id))
        .filter(Boolean);
      
      return orderedPosts || [];
    } catch (error) {
      console.error('Get trending posts error:', error);
      return [];
    }
  },
  
  /**
   * Get suggested users to follow
   */
  getSuggestedUsers: async (limit: number = 10): Promise<any[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      
      // Get users not followed by current user, ordered by follower count
      const { data, error } = await supabase.rpc('get_suggested_users', {
        current_user_id: userData.user.id,
        limit_count: limit,
      });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get suggested users error:', error);
      return [];
    }
  },
  
  // ==================== HISTORY ====================
  
  /**
   * Save search to history
   */
  saveSearchHistory: async (query: string, type: SearchType = 'all'): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Check if already in history
      const { data: existing } = await supabase
        .from('search_history')
        .select('id, count')
        .eq('user_id', userData.user.id)
        .eq('query', query)
        .eq('type', type)
        .maybeSingle();
      
      if (existing) {
        // Update count and timestamp
        await supabase
          .from('search_history')
          .update({
            count: existing.count + 1,
            last_searched: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new entry
        await supabase
          .from('search_history')
          .insert({
            user_id: userData.user.id,
            query,
            type,
            count: 1,
          });
      }
      
      // Keep only last 50 searches
      await supabase.rpc('cleanup_search_history', {
        user_id_param: userData.user.id,
        keep_count: 50,
      });
    } catch (error) {
      console.error('Save search history error:', error);
    }
  },
  
  /**
   * Get search history
   */
  getSearchHistory: async (limit: number = 20): Promise<{ query: string; type: SearchType; count: number; last_searched: string }[]> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];
      
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('last_searched', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get search history error:', error);
      return [];
    }
  },
  
  /**
   * Clear search history
   */
  clearSearchHistory: async (): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userData.user.id);
    } catch (error) {
      console.error('Clear search history error:', error);
    }
  },
  
  // ==================== REALTIME ====================
  
  /**
   * Subscribe to trending updates
   */
  subscribeToTrendingUpdates: (callback: (topics: TrendingTopic[]) => void) => {
    const channel = supabase
      .channel('trending-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async () => {
          const topics = await searchService.getTrendingTopics();
          callback(topics);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

// Helper functions
const calculateRelevance = (item: any, query: string): number => {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  if (item.username) {
    // User search
    if (item.username.toLowerCase().includes(queryLower)) score += 100;
    if (item.display_name?.toLowerCase().includes(queryLower)) score += 50;
    if (item.bio?.toLowerCase().includes(queryLower)) score += 10;
    score += Math.min(item.followers_count || 0, 1000) / 100;
    if (item.is_verified) score += 20;
  } else if (item.content) {
    // Post search
    if (item.content.toLowerCase().includes(queryLower)) score += 100;
    if (item.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) score += 50;
    score += Math.min(item.likes_count || 0, 1000) / 10;
    score += Math.min(item.echoes_count || 0, 1000) / 10;
    score += Math.min(item.comments_count || 0, 500) / 5;
  }
  
  return score;
};

const getTimeAgo = (timeRange: string): Date => {
  const now = new Date();
  switch (timeRange) {
    case 'day': return new Date(now.setDate(now.getDate() - 1));
    case 'week': return new Date(now.setDate(now.getDate() - 7));
    case 'month': return new Date(now.setMonth(now.getMonth() - 1));
    case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
    default: return new Date(0);
  }
};

const getPreviousTagCount = async (tag: string, hoursAgo: number): Promise<number> => {
  try {
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - hoursAgo * 2);
    
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .contains('tags', [tag])
      .gte('created_at', timeAgo.toISOString())
      .lt('created_at', new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString());
    
    return count || 0;
  } catch (error) {
    console.error('Get previous tag count error:', error);
    return 0;
  }
};