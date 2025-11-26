import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react-native';

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark?: () => void;
}

export const PostActions: React.FC<PostActionsProps> = ({
  likeCount,
  commentCount,
  shareCount,
  isLiked,
  isBookmarked = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
}) => {
  return (
    <View className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-6">
          {/* Like Button */}
          <TouchableOpacity 
            onPress={onLike}
            className="flex-row items-center space-x-2"
          >
            <Heart 
              size={20} 
              fill={isLiked ? "#ef4444" : "transparent"}
              color={isLiked ? "#ef4444" : "#6b7280"} 
            />
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {likeCount}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity 
            onPress={onComment}
            className="flex-row items-center space-x-2"
          >
            <MessageCircle size={20} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {commentCount}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity 
            onPress={onShare}
            className="flex-row items-center space-x-2"
          >
            <Share size={20} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {shareCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bookmark Button */}
        {onBookmark && (
          <TouchableOpacity onPress={onBookmark}>
            <Bookmark 
              size={20} 
              fill={isBookmarked ? "#0ea5e9" : "transparent"}
              color={isBookmarked ? "#0ea5e9" : "#6b7280"} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};