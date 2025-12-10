// File: /components/post/CommentSection.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Comment } from '../../types/app';
import CommentItem from './CommentItem';
import { currentTheme } from '../../constants/Colors';

interface CommentSectionProps {
  comments: Comment[];
  isLoading: boolean;
  onLikeComment: (commentId: string) => Promise<void>;
  onUnlikeComment: (commentId: string) => Promise<void>;
  onReply: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLoadMore?: () => void;
  onRefresh?: () => Promise<void>;
  replyingTo?: string | null;
  sortBy?: 'newest' | 'oldest' | 'most_liked';
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  isLoading,
  onLikeComment,
  onUnlikeComment,
  onReply,
  onDeleteComment,
  onLoadMore,
  onRefresh,
  replyingTo,
  sortBy = 'newest',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  
  // Update local comments when props change
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);
  
  // Sort comments
  const sortedComments = React.useMemo(() => {
    const sorted = [...localComments];
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'most_liked':
        return sorted.sort((a, b) => b.likes_count - a.likes_count);
      default: // 'newest'
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [localComments, sortBy]);
  
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing comments:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleLike = async (commentId: string) => {
    try {
      await onLikeComment(commentId);
      // Optimistically update UI
      setLocalComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: true,
            likes_count: comment.likes_count + 1,
          };
        }
        // Also update in replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, is_liked: true, likes_count: reply.likes_count + 1 }
                : reply
            ),
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };
  
  const handleUnlike = async (commentId: string) => {
    try {
      await onUnlikeComment(commentId);
      // Optimistically update UI
      setLocalComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: false,
            likes_count: Math.max(0, comment.likes_count - 1),
          };
        }
        // Also update in replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, is_liked: false, likes_count: Math.max(0, reply.likes_count - 1) }
                : reply
            ),
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };
  
  const handleDelete = async (commentId: string) => {
    if (!onDeleteComment) return;
    
    try {
      await onDeleteComment(commentId);
      // Remove comment from UI
      setLocalComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  const handleEdit = (commentId: string, newContent: string) => {
    setLocalComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, content: newContent, is_edited: true };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: comment.replies.map(reply => 
            reply.id === commentId 
              ? { ...reply, content: newContent, is_edited: true }
              : reply
          ),
        };
      }
      return comment;
    }));
  };
  
  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };
  
  const renderCommentItem = ({ item }: { item: Comment }) => {
    const isReplying = replyingTo === item.id;
    
    return (
      <CommentItem
        comment={item}
        onReply={onReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onLike={handleLike}
        onUnlike={handleUnlike}
        showReplies={expandedComments.has(item.id)}
        onToggleReplies={() => toggleReplies(item.id)}
      />
    );
  };
  
  const renderHeader = () => (
    <View className="px-4 py-3 border-b border-border">
      <View className="flex-row items-center justify-between">
        <Text className="text-text-primary text-lg font-semibold">
          Comments ({localComments.length})
        </Text>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity>
            <Text className="text-brand-primary text-sm">Sort by: {sortBy}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <Text className="text-text-primary text-lg font-semibold mb-2">
        No comments yet
      </Text>
      <Text className="text-text-secondary text-center">
        Be the first to share your thoughts!
      </Text>
    </View>
  );
  
  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={currentTheme.brand.primary} />
        <Text className="text-text-secondary text-sm mt-2">Loading comments...</Text>
      </View>
    );
  };
  
  return (
    <View className="flex-1">
      {renderHeader()}
      
      <FlatList
        data={sortedComments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[currentTheme.brand.primary]}
              tintColor={currentTheme.brand.primary}
            />
          ) : undefined
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
      />
      
      {/* Replying to indicator */}
      {replyingTo && (
        <View className="px-4 py-2 bg-surface border-t border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-text-secondary text-sm">
              Replying to comment...
            </Text>
            <TouchableOpacity onPress={() => onReply('')}>
              <Text className="text-brand-primary text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
});

export default CommentSection;