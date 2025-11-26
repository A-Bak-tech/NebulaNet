import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAI } from '@/hooks/useAI';
import { Sparkles, Zap, Wand2 } from 'lucide-react-native';

interface AIEnhancementModalProps {
  visible: boolean;
  onClose: () => void;
  content: string;
  onContentEnhanced: (enhancedContent: string) => void;
}

export const AIEnhancementModal: React.FC<AIEnhancementModalProps> = ({
  visible,
  onClose,
  content,
  onContentEnhanced,
}) => {
  const [enhancementType, setEnhancementType] = useState<'improve' | 'expand' | 'summarize'>('improve');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { isProcessing, enhanceContent, generateSuggestions } = useAI();

  const handleEnhance = async () => {
    try {
      const enhanced = await enhanceContent(content, 'post');
      onContentEnhanced(enhanced);
      onClose();
    } catch (error) {
      console.error('Enhancement failed:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const generated = await generateSuggestions(content);
      setSuggestions(generated);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  React.useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="AI Enhancement"
      size="lg"
    >
      <ScrollView className="max-h-96">
        {/* Enhancement Options */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Enhancement Type
          </Text>
          <View className="flex-row space-x-2">
            {[
              { key: 'improve', label: 'Improve', icon: Wand2 },
              { key: 'expand', label: 'Expand', icon: Zap },
              { key: 'summarize', label: 'Summarize', icon: Sparkles },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setEnhancementType(option.key as any)}
                className={cn(
                  'flex-1 flex-row items-center justify-center px-3 py-2 rounded-lg border',
                  enhancementType === option.key
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-gray-50 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                )}
              >
                <option.icon 
                  size={16} 
                  color={enhancementType === option.key ? '#0ea5e9' : '#6b7280'} 
                />
                <Text 
                  className={cn(
                    'ml-2 text-sm font-medium',
                    enhancementType === option.key
                      ? 'text-primary-700'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              AI Suggestions
            </Text>
            <View className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <View
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3"
                >
                  <Text className="text-blue-800 dark:text-blue-200 text-sm">
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Original Content Preview */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Original Content
          </Text>
          <View className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              {content}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="flex-row space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          title="Cancel"
          variant="outline"
          onPress={onClose}
          className="flex-1"
        />
        <Button
          title={isProcessing ? "Enhancing..." : "Apply Enhancement"}
          onPress={handleEnhance}
          loading={isProcessing}
          className="flex-1"
        />
      </View>
    </Modal>
  );
};