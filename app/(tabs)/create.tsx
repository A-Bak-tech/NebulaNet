import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Image, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { posts } from '@/lib/posts';
import { aiEnhancement } from '@/lib/ai/enhancement';

export default function CreateScreen() {
  const [content, setContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();

  const handleEnhance = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content first');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhancedContent = await aiEnhancement.enhanceContent(content, 'post');
      setContent(enhancedContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to enhance content');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    setIsPosting(true);
    try {
      await posts.createPost({
        user_id: user.id,
        content: content.trim(),
        ai_enhanced: isEnhancing,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        is_public: true,
        status: 'published',
      });

      setContent('');
      Alert.alert('Success', 'Post published successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to publish post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header 
        title="Create Post" 
        rightAction={
          <Button
            title="Post"
            onPress={handlePost}
            loading={isPosting}
            size="sm"
            disabled={!content.trim()}
          />
        }
      />

      <ScrollView className="flex-1 p-4">
        <Input
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={8}
          className="mb-4"
        />

        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity className="flex-row items-center">
            <Image size={20} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 ml-2">
              Add Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleEnhance}
            disabled={isEnhancing || !content.trim()}
            className="flex-row items-center"
          >
            <Sparkles 
              size={20} 
              color={isEnhancing ? "#0ea5e9" : "#6b7280"} 
            />
            <Text className="text-gray-600 dark:text-gray-400 ml-2">
              {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Suggestions */}
        {content.length > 0 && (
          <View className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <Text className="text-blue-800 dark:text-blue-200 font-medium mb-2">
              AI Suggestions
            </Text>
            <Text className="text-blue-700 dark:text-blue-300 text-sm">
              • Consider adding more details{'\n'}
              • Use relevant hashtags{'\n'}
              • Engage with your audience
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}