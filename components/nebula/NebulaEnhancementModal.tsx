import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { useNebula } from '@/hooks/useNebula';
import { NebulaLoadingIndicator } from './NebulaLoadingIndicator';

interface NebulaEnhancementModalProps {
  visible: boolean;
  onClose: () => void;
  initialContent?: string;
  onContentEnhanced?: (enhancedContent: string) => void;
}

export const NebulaEnhancementModal: React.FC<NebulaEnhancementModalProps> = ({
  visible,
  onClose,
  initialContent = '',
  onContentEnhanced
}) => {
  const [content, setContent] = useState(initialContent);
  const [enhancedContent, setEnhancedContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'professional' | 'casual' | 'creative'>('professional');
  const [creativity, setCreativity] = useState(0.7);
  
  const { enhanceContent } = useNebula();

  const handleEnhance = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content to enhance');
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await enhanceContent(content, {
        style: selectedStyle,
        creativity
      });
      
      setEnhancedContent(result.enhanced);
      
      if (onContentEnhanced) {
        onContentEnhanced(result.enhanced);
      }
    } catch (error) {
      Alert.alert('Enhancement Failed', 'Unable to enhance content. Please try again.');
      console.error('Enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAccept = () => {
    if (enhancedContent) {
      setContent(enhancedContent);
      setEnhancedContent('');
    }
  };

  const handleReplace = () => {
    if (enhancedContent) {
      setContent(enhancedContent);
      setEnhancedContent('');
      onClose();
    }
  };

  const handleReset = () => {
    setContent(initialContent);
    setEnhancedContent('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
            <Text className="text-white text-xl font-bold">Nebula Enhancement</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Original Content */}
            <View className="mb-6">
              <Text className="text-white font-semibold mb-2">Original Content</Text>
              <TextInput
                className="bg-gray-800 text-white rounded-xl p-4 min-h-[120px]"
                placeholder="Enter your content here..."
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Enhancement Options */}
            <View className="mb-6">
              <Text className="text-white font-semibold mb-3">Enhancement Options</Text>
              
              {/* Style Selection */}
              <View className="mb-4">
                <Text className="text-gray-300 mb-2">Style</Text>
                <View className="flex-row space-x-2">
                  {['professional', 'casual', 'creative'].map((style) => (
                    <TouchableOpacity
                      key={style}
                      className={`px-4 py-2 rounded-lg ${
                        selectedStyle === style
                          ? 'bg-purple-600'
                          : 'bg-gray-800'
                      }`}
                      onPress={() => setSelectedStyle(style as any)}
                    >
                      <Text className="text-white capitalize">{style}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Creativity Slider */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-300">Creativity</Text>
                  <Text className="text-purple-400">{creativity.toFixed(1)}</Text>
                </View>
                <View className="h-2 bg-gray-800 rounded-full">
                  <View 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${creativity * 100}%` }}
                  />
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-gray-400 text-xs">Less Creative</Text>
                  <Text className="text-gray-400 text-xs">More Creative</Text>
                </View>
              </View>
            </View>

            {/* Enhance Button */}
            <TouchableOpacity
              className="bg-purple-600 py-4 rounded-xl items-center mb-6"
              onPress={handleEnhance}
              disabled={isEnhancing || !content.trim()}
            >
              {isEnhancing ? (
                <NebulaLoadingIndicator />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Enhance Content
                </Text>
              )}
            </TouchableOpacity>

            {/* Enhanced Content */}
            {enhancedContent ? (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-semibold">Enhanced Content</Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      className="px-3 py-1 bg-green-600 rounded-lg"
                      onPress={handleAccept}
                    >
                      <Text className="text-white text-sm">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-3 py-1 bg-purple-600 rounded-lg"
                      onPress={handleReplace}
                    >
                      <Text className="text-white text-sm">Replace & Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="bg-gray-800 rounded-xl p-4">
                  <Text className="text-white">{enhancedContent}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View className="flex-row justify-between p-4 border-t border-gray-800">
            <TouchableOpacity
              className="px-4 py-2 bg-gray-800 rounded-lg"
              onPress={handleReset}
            >
              <Text className="text-white">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 bg-gray-800 rounded-lg"
              onPress={onClose}
            >
              <Text className="text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};