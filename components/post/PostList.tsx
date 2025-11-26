import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { Post } from '@/types/database';
import { PostCard } from './PostCard';
import { Loader } from '../ui/Loader';

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onPostPress?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  isLoading,
  isRefreshing = false,
  onRefresh,
  onLoadMore,
  onPostPress,
  onLike,
  onComment,
  onShare,
}) => {
  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => onPostPress?.(item.id)}
      onLike={onLike}
      onComment={onComment}
      onShare={onShare}
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return <Loader text="Loading more posts..." />;
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        ) : undefined
      }
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerClassName="pb-4"
      className="flex-1"
    />
  );
};