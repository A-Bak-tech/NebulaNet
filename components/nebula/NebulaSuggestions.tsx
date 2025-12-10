import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { useNebula } from '@/hooks/useNebula';
import { NebulaLoadingIndicator } from './NebulaLoadingIndicator';

interface NebulaSuggestionsProps {
  context?: string;
  onSuggestionSelect?: (suggestion: string) => void;
  initialContent?: string;
  maxSuggestions?: number;
  autoGenerate?: boolean;
}

export const NebulaSuggestions: React.FC<NebulaSuggestionsProps> = ({
  context,
  onSuggestionSelect,
  initialContent = '',
  maxSuggestions = 5,
  autoGenerate = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    'all' | 'completions' | 'paraphrases' | 'questions' | 'topics'
  >('all');
  const [creativity, setCreativity] = useState(0.7);
  
  const { getSuggestions } = useNebula();

  useEffect(() => {
    if (autoGenerate && content.trim()) {
      handleGenerateSuggestions();
    }
  }, [autoGenerate, content]);

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content first');
      return;
    }

    setIsLoading(true);
    try {
      const generated = await getSuggestions(content, {
        maxSuggestions,
        creativity
      });
      
      setSuggestions(generated);
    } catch (error) {
      Alert.alert('Generation Failed', 'Unable to generate suggestions');
      console.error('Suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setContent(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  const handleClear = () => {
    setContent('');
    setSuggestions([]);
  };

  const getFilteredSuggestions = () => {
    if (selectedType === 'all') return suggestions;
    
    // In a real implementation, you'd filter by suggestion type
    return suggestions;
  };

  const suggestionTypes = [
    { id: 'all', label: 'All', icon: '💡' },
    { id: 'completions', label: 'Continue', icon: '➡️' },
    { id: 'paraphrases', label: 'Rephrase', icon: '🔄' },
    { id: 'questions', label: 'Questions', icon: '❓' },
    { id: 'topics', label: 'Topics', icon: '🗣️' }
  ];

  return (
    <View className="bg-gray-800 rounded-xl p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-purple-500 rounded-full items-center justify-center mr-2">
            <Text className="text-white font-bold">N</Text>
          </View>
          <Text className="text-white text-lg font-bold">AI Suggestions</Text>
        </View>
        
        <TouchableOpacity onPress={handleClear}>
          <Text className="text-gray-400">Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Content Input */}
      <TextInput
        className="bg-gray-700 text-white rounded-lg p-3 mb-4 min-h-[80px]"
        placeholder="Enter text to get AI suggestions..."
        placeholderTextColor="#9CA3AF"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      {/* Suggestion Type Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {suggestionTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            className={`px-3 py-2 rounded-lg mr-2 flex-row items-center ${
              selectedType === type.id
                ? 'bg-purple-600'
                : 'bg-gray-700'
            }`}
            onPress={() => setSelectedType(type.id as any)}
          >
            <Text className="mr-1">{type.icon}</Text>
            <Text className="text-white text-sm">{type.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Creativity Slider */}
      <View className="mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-300">Creativity Level</Text>
          <Text className="text-purple-400">{creativity.toFixed(1)}</Text>
        </View>
        <View className="h-2 bg-gray-700 rounded-full">
          <View 
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${creativity * 100}%` }}
          />
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        className="bg-purple-600 py-3 rounded-xl items-center mb-4"
        onPress={handleGenerateSuggestions}
        disabled={isLoading || !content.trim()}
      >
        {isLoading ? (
          <NebulaLoadingIndicator size="small" showMessage={false} />
        ) : (
          <Text className="text-white font-bold">
            Generate Suggestions
          </Text>
        )}
      </TouchableOpacity>

      {/* Suggestions List */}
      {getFilteredSuggestions().length > 0 ? (
        <View>
          <Text className="text-gray-300 font-semibold mb-2">
            Suggestions ({getFilteredSuggestions().length})
          </Text>
          <ScrollView className="max-h-60">
            {getFilteredSuggestions().map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-700 p-3 rounded-lg mb-2 border-l-4 border-purple-500"
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <View className="flex-row items-start">
                  <Text className="text-purple-400 mr-2">•</Text>
                  <Text className="text-white flex-1">{suggestion}</Text>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row justify-end mt-2 space-x-2">
                  <TouchableOpacity
                    className="px-2 py-1 bg-gray-600 rounded"
                    onPress={() => handleSuggestionSelect(suggestion)}
                  >
                    <Text className="text-white text-xs">Use</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-2 py-1 bg-gray-600 rounded"
                    onPress={() => {
                      // Copy to clipboard
                      Alert.alert('Copied', 'Suggestion copied to clipboard');
                    }}
                  >
                    <Text className="text-white text-xs">Copy</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : !isLoading && content.trim() ? (
        <View className="items-center py-4">
          <Text className="text-gray-400">No suggestions yet. Click generate!</Text>
        </View>
      ) : null}

      {/* Quick Actions */}
      {!isLoading && (
        <View className="flex-row flex-wrap gap-2 mt-4">
          <TouchableOpacity
            className="px-3 py-2 bg-gray-700 rounded-lg"
            onPress={() => setContent(content + ' Can you help me expand on this?')}
          >
            <Text className="text-gray-300 text-sm">🤔 Expand</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-2 bg-gray-700 rounded-lg"
            onPress={() => setContent('What are your thoughts on ' + content)}
          >
            <Text className="text-gray-300 text-sm">💬 Discuss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-2 bg-gray-700 rounded-lg"
            onPress={() => setContent('Explain: ' + content)}
          >
            <Text className="text-gray-300 text-sm">📚 Explain</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Compact version for inline use
export const CompactNebulaSuggestions: React.FC<{
  onSuggestionSelect: (suggestion: string) => void;
}> = ({ onSuggestionSelect }) => {
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([
    'Share an interesting fact',
    'Ask for opinions',
    'Start a discussion',
    'Share a personal story'
  ]);

  const handleQuickSuggestion = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    
    // Rotate suggestions
    setQuickSuggestions(prev => {
      const newSuggestions = [...prev.slice(1), prev[0]];
      return newSuggestions;
    });
  };

  return (
    <View className="bg-gray-800 rounded-lg p-3">
      <Text className="text-gray-300 text-sm mb-2">💡 Quick Ideas</Text>
      <View className="flex-row flex-wrap gap-2">
        {quickSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            className="px-3 py-2 bg-gray-700 rounded-lg"
            onPress={() => handleQuickSuggestion(suggestion)}
          >
            <Text className="text-white text-xs">{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};