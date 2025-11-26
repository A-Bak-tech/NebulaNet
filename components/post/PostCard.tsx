import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Post } from '@/types/database';
import { Avatar } from '../ui/Avatar';
import { PostActions } from './PostActions';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      {/* Header */}
      <View className="p-4 flex-row items-center">
        <Avatar 
          source={post.user?.avatar_url} 
          name={post.user?.full_name || post.user?.username}
          size="md"
        />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-gray-900 dark:text-white">
            {post.user?.full_name || post.user?.username}
          </Text>
          <Text className="text-gray-500 text-sm">
            {formatDistanceToNow(new Date(post.created_at))} ago
          </Text>
        </View>
        {post.ai_enhanced && (
          <View className="bg-nebula-100 dark:bg-nebula-900 px-2 py-1 rounded-full">
            <Text className="text-nebula-700 dark:text-nebula-300 text-xs font-medium">
              AI Enhanced
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onPress} className="px-4 pb-3">
        <Text className="text-gray-900 dark:text-white text-base leading-6">
          {post.content}
        </Text>
        
        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <View className="mt-3 rounded-lg overflow-hidden">
            <Image
              source={{ uri: post.media_urls[0] }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <PostActions
        postId={post.id}
        likeCount={likeCount}
        commentCount={post.comments_count}
        shareCount={post.shares_count}
        isLiked={isLiked}
        onLike={handleLike}
        onComment={() => onComment?.(post.id)}
        onShare={() => onShare?.(post.id)}
      />
    </View>
  );
};