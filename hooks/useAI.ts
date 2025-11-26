import { useState } from 'react';
import { aiEnhancement } from '@/lib/ai/enhancement';

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const enhanceContent = async (content: string, type: 'post' | 'comment') => {
    setIsProcessing(true);
    try {
      const enhanced = await aiEnhancement.enhanceContent(content, type);
      return enhanced;
    } catch (error) {
      console.error('AI enhancement error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeSentiment = async (content: string) => {
    try {
      const analysis = await aiEnhancement.analyzeSentiment(content);
      return analysis;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  };

  const generateSuggestions = async (content: string) => {
    try {
      const suggestions = await aiEnhancement.generateSuggestions(content);
      return suggestions;
    } catch (error) {
      console.error('Suggestion generation error:', error);
      throw error;
    }
  };

  return {
    isProcessing,
    enhanceContent,
    analyzeSentiment,
    generateSuggestions,
  };
};