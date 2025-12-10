import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTextGeneration } from '@/hooks/useTextGeneration';

interface NebulaTextGeneratorProps {
  initialPrompt?: string;
  onTextGenerated?: (text: string) => void;
}

export const NebulaTextGenerator: React.FC<NebulaTextGeneratorProps> = ({
  initialPrompt = '',
  onTextGenerated
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { generate } = useTextGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const text = await generate(prompt, {
        maxLength: 500,
        temperature: 0.8
      });
      
      setGeneratedText(text);
      onTextGenerated?.(text);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setGeneratedText('');
  };

  return (
    <View className="bg-gray-800 rounded-xl p-4">
      <Text className="text-white text-lg font-semibold mb-3">
        Nebula Text Generator
      </Text>
      
      <TextInput
        className="bg-gray-700 text-white rounded-lg p-3 mb-3 min-h-[100px]"
        placeholder="Enter your prompt here..."
        placeholderTextColor="#9CA3AF"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        textAlignVertical="top"
      />
      
      <View className="flex-row space-x-2 mb-4">
        <TouchableOpacity
          className="flex-1 bg-purple-600 py-3 rounded-lg items-center"
          onPress={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          <Text className="text-white font-semibold">
            {isGenerating ? 'Generating...' : 'Generate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="w-12 bg-gray-700 rounded-lg items-center justify-center"
          onPress={handleClear}
        >
          <Text className="text-white">✕</Text>
        </TouchableOpacity>
      </View>
      
      {generatedText ? (
        <View className="mt-4">
          <Text className="text-gray-300 text-sm mb-2">Generated Text:</Text>
          <ScrollView className="max-h-60">
            <View className="bg-gray-900 p-3 rounded-lg">
              <Text className="text-white">{generatedText}</Text>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};