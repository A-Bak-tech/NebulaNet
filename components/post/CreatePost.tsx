import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { Image as ImageIcon, X, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface CreatePostProps {
  onPostCreated?: () => void;
  compact?: boolean;
}

export const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  compact = false,
}) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return;

    setIsPosting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContent('');
      setImages([]);
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  if (compact) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <View className="flex-row space-x-3">
          <Avatar 
            source={user?.avatar_url}
            name={user?.full_name || user?.username}
            size="md"
          />
          <TouchableOpacity 
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 justify-center"
            onPress={() => {/* Navigate to full create screen */}}
          >
            <Text className="text-gray-500 dark:text-gray-400">
              What's on your mind?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <View className="flex-row space-x-3 mb-4">
        <Avatar 
          source={user?.avatar_url}
          name={user?.full_name || user?.username}
          size="md"
        />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 dark:text-white">
            {user?.full_name || user?.username}
          </Text>
          <Text className="text-gray-500 text-sm">
            @{user?.username}
          </Text>
        </View>
      </View>

      <Input
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        className="mb-4"
      />

      {/* Image Preview */}
      {images.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {images.map((image, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: image }}
                className="w-20 h-20 rounded-lg"
              />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <X size={12} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={pickImage} className="flex-row items-center">
            <ImageIcon size={20} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 ml-2">
              Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <Sparkles size={20} color="#6b7280" />
            <Text className="text-gray-600 dark:text-gray-400 ml-2">
              AI Enhance
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Post"
          onPress={handlePost}
          loading={isPosting}
          disabled={!content.trim() && images.length === 0}
          size="sm"
        />
      </View>
    </View>
  );
};