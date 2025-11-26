import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { PostCard } from '@/components/post/PostCard';
import { CommentSection } from '@/components/post/CommentSection';
import { Post } from '@/types/database';
import { posts } from '@/lib/posts';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const postData = await posts.getPost(id);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentPress = () => {
    setShowComments(true);
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <Header title="Post" showBack />
        <View className="flex-1 items-center justify-center">
          <Text>Loading...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper>
        <Header title="Post" showBack />
        <View className="flex-1 items-center justify-center">
          <Text>Post not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Header title="Post" showBack />
      
      <View className="flex-1">
        {/* Post Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <PostCard
            post={post}
            onComment={handleCommentPress}
            onLike={(postId) => console.log('Like:', postId)}
            onShare={(postId) => console.log('Share:', postId)}
          />
        </ScrollView>

        {/* Comments Section */}
        <CommentSection
          postId={post.id}
          visible={showComments}
        />
      </View>
    </ScreenWrapper>
  );
}