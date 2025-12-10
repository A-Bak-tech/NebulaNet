import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useNebula } from '@/hooks/useNebula';
import { NebulaLoadingIndicator } from './NebulaLoadingIndicator';

interface NebulaAssistantProps {
  context?: string;
  onSuggestionSelect?: (text: string) => void;
  maxSuggestions?: number;
}

export const NebulaAssistant: React.FC<NebulaAssistantProps> = ({
  context,
  onSuggestionSelect,
  maxSuggestions = 3
}) => {
  const [input, setInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const { generateText, isLoading, suggestions } = useNebula();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    const prompt = context 
      ? `${context}\n\nUser: ${input}`
      : input;
    
    await generateText(prompt, {
      temperature: 0.7,
      maxLength: 200
    });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInput(suggestion);
    onSuggestionSelect?.(suggestion);
  };

  return (
    <View className="bg-gray-900 rounded-2xl p-4">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 bg-purple-500 rounded-full items-center justify-center mr-3">
          <Text className="text-white font-bold">N</Text>
        </View>
        <Text className="text-white text-lg font-bold">Nebula Assistant</Text>
        <TouchableOpacity 
          className="ml-auto"
          onPress={() => setIsActive(!isActive)}
        >
          <Text className="text-purple-400">
            {isActive ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {isActive && (
        <>
          <TextInput
            className="bg-gray-800 text-white rounded-xl p-3 mb-3"
            placeholder="Ask Nebula for help..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />

          {isLoading ? (
            <NebulaLoadingIndicator />
          ) : suggestions.length > 0 ? (
            <ScrollView className="max-h-40">
              {suggestions.slice(0, maxSuggestions).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  className="bg-gray-800 p-3 rounded-xl mb-2"
                  onPress={() => handleSuggestionSelect(suggestion)}
                >
                  <Text className="text-white">{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          <TouchableOpacity
            className="bg-purple-600 py-3 rounded-xl items-center mt-3"
            onPress={handleGenerate}
            disabled={isLoading}
          >
            <Text className="text-white font-semibold">
              {isLoading ? 'Generating...' : 'Generate Suggestions'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};