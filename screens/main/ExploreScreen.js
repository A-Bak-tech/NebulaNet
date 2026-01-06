// screens/ExploreScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const TRENDING_HASHTAGS = [
  { id: 1, tag: '#Photography', posts: '12.5k' },
  { id: 2, tag: '#Wellness', posts: '8.9k' },
  { id: 3, tag: '#TechNews', posts: '15.2k' },
  { id: 4, tag: '#ArtCommunity', posts: '6.7k' },
  { id: 5, tag: '#Mindfulness', posts: '5.4k' },
];

const FEATURED_COMMUNITIES = [
  {
    id: 1,
    name: 'Travel Diaries',
    members: '45.2k',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
  },
  {
    id: 2,
    name: 'Food Lovers',
    members: '67.8k',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
  },
  {
    id: 3,
    name: 'Fitness Enthusiasts',
    members: '32.1k',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
  },
];

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const fetchTrendingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('like_count', { ascending: false })
        .limit(10);

      if (!error) {
        setTrendingPosts(data || []);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity style={styles.trendingItem}>
      <View style={styles.trendingContent}>
        <Text style={styles.trendingText} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingUser}>
            @{item.profiles?.username || 'user'}
          </Text>
          <Text style={styles.trendingLikes}>
            {item.like_count} likes
          </Text>
        </View>
      </View>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.trendingImage} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#657786" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search NebulaNet"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView>
        {/* Trending Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {TRENDING_HASHTAGS.map((hashtag) => (
              <TouchableOpacity key={hashtag.id} style={styles.hashtagCard}>
                <Text style={styles.hashtagText}>{hashtag.tag}</Text>
                <Text style={styles.hashtagPosts}>{hashtag.posts} posts</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Communities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Communities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED_COMMUNITIES.map((community) => (
              <TouchableOpacity key={community.id} style={styles.communityCard}>
                <Image source={{ uri: community.image }} style={styles.communityImage} />
                <View style={styles.communityInfo}>
                  <Text style={styles.communityName}>{community.name}</Text>
                  <View style={styles.communityMembers}>
                    <Ionicons name="people" size={14} color="#657786" />
                    <Text style={styles.memberCount}>{community.members}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Posts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Posts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={trendingPosts}
            renderItem={renderTrendingItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Discover Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover by Interest</Text>
          <View style={styles.categoriesGrid}>
            {['Art', 'Tech', 'Music', 'Fitness', 'Food', 'Travel'].map((category) => (
              <TouchableOpacity key={category} style={styles.categoryCard}>
                <View style={styles.categoryIcon}>
                  <Ionicons name="star" size={24} color="#1DA1F2" />
                </View>
                <Text style={styles.categoryName}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1DA1F2',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#14171A',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 12,
  },
  seeAll: {
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '600',
  },
  hashtagCard: {
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 4,
  },
  hashtagPosts: {
    fontSize: 12,
    color: '#657786',
  },
  communityCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F8FA',
  },
  communityImage: {
    width: '100%',
    height: 120,
  },
  communityInfo: {
    padding: 12,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 4,
  },
  communityMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#657786',
  },
  trendingItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  trendingContent: {
    flex: 1,
    marginRight: 12,
  },
  trendingText: {
    fontSize: 14,
    color: '#14171A',
    marginBottom: 8,
    lineHeight: 18,
  },
  trendingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendingUser: {
    fontSize: 12,
    color: '#657786',
  },
  trendingLikes: {
    fontSize: 12,
    color: '#657786',
  },
  trendingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14171A',
  },
});