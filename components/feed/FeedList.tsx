import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { Post } from '@/types/database';
import { PostCard } from '../post/PostCard';

interface FeedListProps {
  posts: Post[];
  isLoading: boolean;
  onLoadMore: () => void;
  onPostPress?: (postId: string) => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  isLoading,
  onLoadMore,
  onPostPress,
}) => {
  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => onPostPress?.(item.id)}
      onLike={(postId) => console.log('Like post:', postId)}
      onComment={(postId) => onPostPress?.(postId)}
      onShare={(postId) => console.log('Share post:', postId)}
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#0ea5e9" />
      </View>
    );
  };

  return (
    <View className="flex-1">
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerClassName="pb-4"
      />
    </View>
  );
};