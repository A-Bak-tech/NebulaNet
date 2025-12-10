// File: /components/post/CommentInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  SendIcon,
  ImageIcon,
  SmileIcon,
  XIcon,
  AtIcon,
} from '../../assets/icons';
import { Avatar } from '../ui/Avatar';
import { currentTheme } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';

interface CommentInputProps {
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  replyingTo?: string | null;
  onCancelReply?: () => void;
  postId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  showAvatar?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  replyingTo,
  onCancelReply,
  postId,
  placeholder = 'Write a comment...',
  autoFocus = false,
  showAvatar = true,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const heightAnim = useRef(new Animated.Value(40)).current;
  
  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;
    
    const content = comment.trim();
    setIsSubmitting(true);
    
    try {
      await onSubmit(content, replyingTo || undefined);
      setComment('');
      if (replyingTo && onCancelReply) {
        onCancelReply();
      }
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMention = () => {
    // Insert @mention
    setComment(prev => prev + '@');
    inputRef.current?.focus();
  };
  
  const handleAttach = () => {
    // TODO: Implement image attachment
    console.log('Attach image');
  };
  
  const handleEmoji = () => {
    // TODO: Implement emoji picker
    console.log('Open emoji picker');
  };
  
  // Animate height based on content
  useEffect(() => {
    const lineHeight = 20;
    const lines = Math.min(Math.max(comment.split('\n').length, 1), 5);
    const newHeight = Math.max(40, lines * lineHeight + 20);
    
    Animated.timing(heightAnim, {
      toValue: newHeight,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [comment]);
  
  // Focus input when replying to a comment
  useEffect(() => {
    if (replyingTo) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [replyingTo]);
  
  const isDisabled = !comment.trim() || isSubmitting;
  
  return (
    <View className="border-t border-border bg-background">
      {/* Reply indicator */}
      {replyingTo && onCancelReply && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-surface">
          <Text className="text-text-secondary text-sm">
            Replying to comment
          </Text>
          <TouchableOpacity onPress={onCancelReply}>
            <XIcon size={18} color={currentTheme.icon.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Input area */}
      <View className="flex-row items-start px-4 py-3">
        {showAvatar && user && (
          <TouchableOpacity
            className="mr-3"
            onPress={() => router.push('/profile')}
          >
            <Avatar
              source={user.avatar_url ? { uri: user.avatar_url } : undefined}
              size={36}
              placeholder={user.display_name?.[0] || user.username?.[0] || '?'}
            />
          </TouchableOpacity>
        )}
        
        <View className="flex-1">
          <Animated.View style={{ height: heightAnim }}>
            <TextInput
              ref={inputRef}
              value={comment}
              onChangeText={setComment}
              placeholder={placeholder}
              placeholderTextColor={currentTheme.text.tertiary}
              multiline
              maxLength={1000}
              className="text-text-primary text-base flex-1"
              autoFocus={autoFocus}
              editable={!isSubmitting}
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
              returnKeyType="send"
              textAlignVertical="center"
            />
          </Animated.View>
          
          {/* Character counter */}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-text-tertiary text-xs">
              {comment.length}/1000
            </Text>
            
            {/* Action buttons */}
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity onPress={handleMention}>
                <AtIcon size={20} color={currentTheme.icon.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleAttach}>
                <ImageIcon size={20} color={currentTheme.icon.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleEmoji}>
                <SmileIcon size={20} color={currentTheme.icon.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Send button */}
        <TouchableOpacity
          className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
            isDisabled ? 'bg-brand-primary/30' : 'bg-brand-primary'
          }`}
          onPress={handleSubmit}
          disabled={isDisabled}
        >
          <SendIcon 
            size={20} 
            color={isDisabled ? currentTheme.icon.disabled : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Bottom safe area for iOS */}
      {Platform.OS === 'ios' && (
        <View className="h-4 bg-background" />
      )}
    </View>
  );
};

export default CommentInput;