// File: /components/post/CommentItem.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Comment } from '../../types/app';
import { 
  HeartIcon, 
  HeartFilledIcon, 
  ReplyIcon, 
  MoreIcon,
  EditIcon,
  DeleteIcon,
} from '../../assets/icons';
import { Avatar } from '../ui/Avatar';
import { currentTheme } from '../../constants/Colors';
import { formatDistanceToNow } from '../../utils/date';
import postsService from '../../lib/posts';
import { useAuth } from '../../hooks/useAuth';

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onLike?: (commentId: string) => Promise<void>;
  onUnlike?: (commentId: string) => Promise<void>;
  isReply?: boolean;
  showReplies?: boolean;
  onToggleReplies?: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  isReply = false,
  showReplies = false,
  onToggleReplies,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  
  const isOwnComment = user?.id === comment.user_id;
  const isDeleted = comment.is_deleted;
  
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (comment.is_liked && onUnlike) {
        await onUnlike(comment.id);
      } else if (onLike) {
        await onLike(comment.id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like comment');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleUserPress = () => {
    if (comment.user) {
      router.push(`/profile?id=${comment.user.id}`);
    }
  };
  
  const handleReply = () => {
    onReply(comment.id);
  };
  
  const handleEdit = async () => {
    if (!editedContent.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    
    if (editedContent === comment.content) {
      setIsEditing(false);
      return;
    }
    
    try {
      // Call edit API
      // This would be implemented when you have an edit comment API
      // await postsService.editComment(comment.id, editedContent);
      Alert.alert('Success', 'Comment updated');
      setIsEditing(false);
      if (onEdit) {
        onEdit(comment.id, editedContent);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update comment');
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await postsService.deleteComment(comment.id);
              if (response.success) {
                Alert.alert('Success', 'Comment deleted');
                if (onDelete) {
                  onDelete(comment.id);
                }
              } else {
                Alert.alert('Error', response.error || 'Failed to delete comment');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete comment');
            }
          },
        },
      ]
    );
    setShowOptions(false);
  };
  
  const renderOptionsMenu = () => {
    if (!showOptions) return null;
    
    return (
      <View className="absolute top-8 right-0 bg-surface border border-border rounded-lg shadow-lg z-10 min-w-[150]">
        {isOwnComment && !isDeleted && (
          <>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-border"
              onPress={() => {
                setShowOptions(false);
                setIsEditing(true);
              }}
            >
              <EditIcon size={16} color={currentTheme.icon.primary} />
              <Text className="text-text-primary ml-2">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-border"
              onPress={handleDelete}
            >
              <DeleteIcon size={16} color="#FF3B30" />
              <Text className="text-[#FF3B30] ml-2">Delete</Text>
            </TouchableOpacity>
          </>
        )}
        {!isOwnComment && (
          <>
            <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-border">
              <Text className="text-text-primary">Report</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center px-4 py-3">
              <Text className="text-text-primary">Block User</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };
  
  if (isDeleted) {
    return (
      <View className={`${isReply ? 'ml-12' : ''} py-3 border-b border-border`}>
        <Text className="text-text-secondary italic">[comment deleted]</Text>
      </View>
    );
  }
  
  return (
    <View className={`${isReply ? 'ml-12' : ''} py-3 border-b border-border`}>
      {/* Comment Header */}
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <Avatar
            source={comment.user?.avatar_url ? { uri: comment.user.avatar_url } : undefined}
            size={32}
            placeholder={comment.user?.display_name?.[0] || comment.user?.username?.[0] || '?'}
          />
          <View className="ml-2">
            <Text className="text-text-primary font-semibold text-sm">
              {comment.user?.display_name || comment.user?.username || 'Unknown'}
            </Text>
            <Text className="text-text-tertiary text-xs">
              {formatDistanceToNow(new Date(comment.created_at))}
              {comment.is_edited && ' · Edited'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View className="relative">
          <TouchableOpacity onPress={() => setShowOptions(!showOptions)}>
            <MoreIcon size={18} color={currentTheme.icon.primary} />
          </TouchableOpacity>
          {renderOptionsMenu()}
        </View>
      </View>
      
      {/* Comment Content */}
      {isEditing ? (
        <View className="mb-3">
          <TextInput
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            className="border border-border rounded-lg p-3 text-text-primary"
            autoFocus
          />
          <View className="flex-row justify-end mt-2 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                setIsEditing(false);
                setEditedContent(comment.content);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={handleEdit}
            >
              Save
            </Button>
          </View>
        </View>
      ) : (
        <Text className="text-text-primary text-base leading-5 mb-3">
          {comment.content}
        </Text>
      )}
      
      {/* Comment Actions */}
      <View className="flex-row items-center space-x-6">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleLike}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color={currentTheme.brand.primary} />
          ) : comment.is_liked ? (
            <HeartFilledIcon size={18} color="#FF3B30" />
          ) : (
            <HeartIcon size={18} color={currentTheme.icon.primary} />
          )}
          <Text className={`ml-1 text-sm ${comment.is_liked ? 'text-[#FF3B30]' : 'text-text-secondary'}`}>
            {comment.likes_count > 0 ? comment.likes_count.toLocaleString() : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center"
          onPress={handleReply}
        >
          <ReplyIcon size={18} color={currentTheme.icon.primary} />
          <Text className="ml-1 text-text-secondary text-sm">Reply</Text>
        </TouchableOpacity>
        
        {/* Show replies toggle */}
        {comment.replies_count > 0 && onToggleReplies && (
          <TouchableOpacity onPress={onToggleReplies}>
            <Text className="text-brand-primary text-sm">
              {showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Replies (if expanded) */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onUnlike={onUnlike}
              isReply
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default CommentItem;