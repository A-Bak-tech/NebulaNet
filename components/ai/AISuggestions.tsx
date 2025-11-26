import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: 'hashtag' | 'topic' | 'improvement';
  confidence: number;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onSuggestionSelect?: (suggestion: AISuggestion) => void;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onSuggestionSelect,
}) => {
  if (suggestions.length === 0) return null;

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'hashtag':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'topic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'improvement':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <View className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
      <View className="flex-row items-center mb-3">
        <Sparkles size={20} color="#8b5cf6" />
        <Text className="font-semibold text-gray-900 dark:text-white ml-2">
          AI Suggestions
        </Text>
      </View>

      <View className="space-y-3">
        {suggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            onPress={() => onSuggestionSelect?.(suggestion)}
            className="flex-row items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <View className="flex-1">
              <View className="flex-row items-center space-x-2 mb-1">
                <Text
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    getSuggestionColor(suggestion.type)
                  )}
                >
                  {suggestion.type}
                </Text>
                <Text className="text-xs text-gray-500">
                  {Math.round(suggestion.confidence * 100)}% confidence
                </Text>
              </View>
              <Text className="font-medium text-gray-900 dark:text-white text-sm">
                {suggestion.title}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {suggestion.description}
              </Text>
            </View>
            <ChevronRight size={16} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};