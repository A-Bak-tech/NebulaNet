import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import debounce from 'lodash/debounce';
import { 
  Search, 
  Hash, 
  Users, 
  Camera, 
  TrendingUp,
  X 
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    hashtags: []
  });
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState({
    search: false,
    trending: true,
    suggestions: true
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrendingTopics();
    fetchSuggestedUsers();
    fetchRecentPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults({ users: [], posts: [], hashtags: [] });
    }
  }, [searchQuery]);

  const fetchTrendingTopics = async () => {
    try {
      // Get trending hashtags from the last 24 hours
      const { data, error } = await supabase
        .from('posts')
        .select('hashtags')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process hashtag frequency
      const hashtagCounts = {};
      data.forEach(post => {
        post.hashtags?.forEach(hashtag => {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
        });
      });

      const trending = Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({
          tag: `#${tag}`,
          count,
          posts: `${count} posts`
        }));

      setTrendingTopics(trending);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setLoading(prev => ({ ...prev, trending: false }));
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setSuggestedUsers(data || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(prev => ({ ...prev, suggestions: false }));
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentPosts(data || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) return;

      try {
        setLoading(prev => ({ ...prev, search: true }));

        const normalizedQuery = query.toLowerCase().trim();

        // Search users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${normalizedQuery}%,full_name.ilike.%${normalizedQuery}%`)
          .limit(10);

        // Search posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)
          `)
          .or(`content.ilike.%${normalizedQuery}%,hashtags.cs.{${normalizedQuery.replace('#', '')}}`)
          .limit(10);

        // Search hashtags
        const { data: hashtagsData } = await supabase
          .from('posts')
          .select('hashtags')
          .contains('hashtags', [normalizedQuery.replace('#', '')])
          .limit(10);

        setSearchResults({
          users: usersData || [],
          posts: postsData || [],
          hashtags: hashtagsData?.flatMap(d => d.hashtags).filter((v, i, a) => a.indexOf(v) === i) || []
        });
      } catch (error) {
        console.error('Error performing search:', error);
      } finally {
        setLoading(prev => ({ ...prev, search: false }));
      }
    }, 300),
    []
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTrendingTopics(),
      fetchSuggestedUsers(),
      fetchRecentPosts()
    ]);
    setRefreshing(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({ users: [], posts: [], hashtags: [] });
  };

  const categories = ['All', 'Photography', 'Design', 'Technology', 'Travel', 'Food', 'Fashion', 'Art'];

  const renderSearchResults = () => {
    if (loading.search) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (searchQuery.trim() && !searchResults.users.length && !searchResults.posts.length && !searchResults.hashtags.length) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No results found</Text>
          <Text style={styles.emptyStateSubtext}>Try searching for something else</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <ScrollView style={styles.searchResults}>
          {searchResults.users.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Users</Text>
              {searchResults.users.map(user => (
                <TouchableOpacity key={user.id} style={styles.userItem}>
                  <Image
                    source={{ uri: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.full_name || user.username}</Text>
                    <Text style={styles.userHandle}>@{user.username}</Text>
                  </View>
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Follow</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchResults.hashtags.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Hashtags</Text>
              {searchResults.hashtags.map((hashtag, index) => (
                <TouchableOpacity key={index} style={styles.hashtagItem}>
                  <Hash size={20} color="#007AFF" />
                  <Text style={styles.hashtagText}>#{hashtag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.trim() && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <X size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim() ? (
        renderSearchResults()
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        >
          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryPill,
                  activeCategory === category.toLowerCase() && styles.activeCategoryPill
                ]}
                onPress={() => setActiveCategory(category.toLowerCase())}
              >
                <Text style={[
                  styles.categoryText,
                  activeCategory === category.toLowerCase() && styles.activeCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Trending Topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#000" />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            {loading.trending ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              trendingTopics.map((topic, index) => (
                <TouchableOpacity key={index} style={styles.topicItem}>
                  <View style={styles.topicIcon}>
                    <Hash size={16} color="#007AFF" />
                  </View>
                  <View style={styles.topicContent}>
                    <Text style={styles.topicTag}>{topic.tag}</Text>
                    <Text style={styles.topicPosts}>{topic.posts}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Suggested Users */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#000" />
              <Text style={styles.sectionTitle}>Suggested for You</Text>
            </View>
            {loading.suggestions ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              suggestedUsers.map((user) => (
                <TouchableOpacity key={user.id} style={styles.userItem}>
                  <Image
                    source={{ uri: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.full_name || user.username}</Text>
                    <Text style={styles.userHandle}>@{user.username}</Text>
                  </View>
                  <TouchableOpacity style={styles.followButton}>
                    <Text style={styles.followButtonText}>Follow</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recent Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Camera size={20} color="#000" />
              <Text style={styles.sectionTitle}>Recent Posts</Text>
            </View>
            {recentPosts.slice(0, 3).map((post) => (
              <TouchableOpacity key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image 
                    source={{ uri: post.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}` }} 
                    style={styles.postAvatar}
                  />
                  <View style={styles.postUserInfo}>
                    <Text style={styles.postUserName}>{post.user?.full_name || post.user?.username}</Text>
                    <Text style={styles.postUserHandle}>@{post.user?.username}</Text>
                  </View>
                </View>
                {post.content && (
                  <Text style={styles.postContent} numberOfLines={3}>
                    {post.content}
                  </Text>
                )}
                {post.media_url?.[0] && (
                  <Image 
                    source={{ uri: post.media_url[0] }} 
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  searchResults: {
    flex: 1,
  },
  resultsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeCategoryText: {
    color: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  topicIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topicContent: {
    flex: 1,
  },
  topicTag: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  topicPosts: {
    fontSize: 14,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  postUserHandle: {
    fontSize: 14,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

export default SearchScreen;