import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Comment } from '@/types/database';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { posts } from '@/lib/posts';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
  visible: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  visible,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      loadComments();
    }
  }, [visible, postId]);

  const loadComments = async () => {
    try {
      const postComments = await posts.getComments(postId);
      setComments(postComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsLoading(true);
    try {
      const comment = await posts.addComment({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        likes_count: 0,
      });

      setComments(prev => [...prev, { ...comment, user }]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="flex-row space-x-3 p-3 border-b border-gray-100 dark:border-gray-700">
      <Avatar 
        source={item.user?.avatar_url}
        name={item.user?.full_name || item.user?.username}
        size="sm"
      />
      <View className="flex-1">
        <View className="flex-row items-center space-x-2 mb-1">
          <Text className="font-semibold text-gray-900 dark:text-white text-sm">
            {item.user?.full_name || item.user?.username}
          </Text>
          <Text className="text-gray-500 text-xs">
            {formatDistanceToNow(new Date(item.created_at))} ago
          </Text>
        </View>
        <Text className="text-gray-700 dark:text-gray-300 text-sm">
          {item.content}
        </Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View className="flex-1 bg-white dark:bg-gray-800">
      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      />

      {/* Add Comment */}
      <View className="p-4 border-t border-gray-200 dark:border-gray-700">
        <View className="flex-row space-x-3">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            className="flex-1 mb-0"
          />
          <Button
            title="Post"
            onPress={handleAddComment}
            loading={isLoading}
            disabled={!newComment.trim()}
            size="sm"
          />
        </View>
      </View>
    </View>
  );
};