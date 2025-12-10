import { useState, useCallback, useEffect } from 'react';
import { NebulaAI } from '@/lib/nebula';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GenerationOptions {
  temperature?: number;
  maxLength?: number;
  topP?: number;
  topK?: number;
  creativity?: number;
  style?: 'casual' | 'professional' | 'creative';
}

export interface GenerationHistoryItem {
  id: string;
  prompt: string;
  result: string;
  timestamp: Date;
  options: GenerationOptions;
}

export const useTextGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Initialize Nebula AI
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setModelStatus('loading');
        const nebula = NebulaAI.getInstance();
        await nebula.initialize();
        setModelStatus('ready');
        
        // Load generation history
        await loadHistory();
      } catch (error) {
        console.error('Failed to initialize text generation model:', error);
        setModelStatus('error');
      }
    };

    initializeModel();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('nebula_generation_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
        
        // Extract recent prompts
        const prompts = parsed
          .slice(0, 10)
          .map((item: any) => item.prompt)
          .filter((p: string) => p.length > 0);
        setRecentPrompts([...new Set(prompts)]);
      }
    } catch (error) {
      console.error('Failed to load generation history:', error);
    }
  };

  const saveHistory = async (newHistory: GenerationHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(
        'nebula_generation_history',
        JSON.stringify(newHistory.slice(-50)) // Keep last 50 items
      );
    } catch (error) {
      console.error('Failed to save generation history:', error);
    }
  };

  const generate = useCallback(async (
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> => {
    if (modelStatus !== 'ready') {
      throw new Error('Text generation model is not ready');
    }

    setIsGenerating(true);
    try {
      const nebula = NebulaAI.getInstance();
      
      // Track generation start
      const startTime = Date.now();
      
      // Generate text
      const result = await nebula.generateText(prompt, options);
      
      const generationTime = Date.now() - startTime;
      
      // Add to history
      const historyItem: GenerationHistoryItem = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        prompt,
        result,
        timestamp: new Date(),
        options
      };
      
      const newHistory = [...history, historyItem];
      setHistory(newHistory);
      await saveHistory(newHistory);
      
      // Update recent prompts
      if (!recentPrompts.includes(prompt)) {
        const newPrompts = [prompt, ...recentPrompts].slice(0, 10);
        setRecentPrompts(newPrompts);
      }
      
      // Track analytics
      nebula.analytics.trackEvent({
        type: 'text_generation',
        duration: generationTime,
        success: true,
        metadata: {
          promptLength: prompt.length,
          resultLength: result.length,
          options
        }
      });
      
      return result;
      
    } catch (error) {
      const nebula = NebulaAI.getInstance();
      nebula.analytics.trackEvent({
        type: 'text_generation',
        duration: 0,
        success: false,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          promptLength: prompt.length
        }
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [modelStatus, history, recentPrompts]);

  const generateWithContext = useCallback(async (
    context: string,
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> => {
    const fullPrompt = `${context}\n\nUser: ${prompt}\n\nAssistant:`;
    return generate(fullPrompt, options);
  }, [generate]);

  const batchGenerate = useCallback(async (
    prompts: string[],
    options: GenerationOptions = {}
  ): Promise<string[]> => {
    const results: string[] = [];
    
    for (const prompt of prompts) {
      try {
        const result = await generate(prompt, options);
        results.push(result);
      } catch (error) {
        results.push(`Error generating for prompt: ${prompt}`);
      }
    }
    
    return results;
  }, [generate]);

  const retryGeneration = useCallback(async (
    historyId: string,
    newOptions?: Partial<GenerationOptions>
  ): Promise<string> => {
    const item = history.find(h => h.id === historyId);
    if (!item) {
      throw new Error('Generation history item not found');
    }
    
    const options = { ...item.options, ...newOptions };
    return generate(item.prompt, options);
  }, [history, generate]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    setRecentPrompts([]);
    await AsyncStorage.removeItem('nebula_generation_history');
  }, []);

  const getHistoryStats = useCallback(() => {
    const totalGenerations = history.length;
    const totalCharacters = history.reduce((sum, item) => 
      sum + item.result.length, 0
    );
    const avgLength = totalGenerations > 0 
      ? totalCharacters / totalGenerations 
      : 0;
    
    // Most common options
    const optionCounts: Record<string, number> = {};
    history.forEach(item => {
      const key = JSON.stringify(item.options);
      optionCounts[key] = (optionCounts[key] || 0) + 1;
    });
    
    const mostCommonOptions = Object.entries(optionCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalGenerations,
      totalCharacters,
      avgLength,
      mostCommonOptions: mostCommonOptions 
        ? JSON.parse(mostCommonOptions[0]) 
        : null
    };
  }, [history]);

  const exportHistory = useCallback(async (format: 'json' | 'csv' = 'json') => {
    const exportData = {
      history,
      exportDate: new Date().toISOString(),
      stats: getHistoryStats()
    };
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Timestamp', 'Prompt', 'Result', 'Options'];
      const rows = history.map(item => [
        item.timestamp.toISOString(),
        `"${item.prompt.replace(/"/g, '""')}"`,
        `"${item.result.replace(/"/g, '""')}"`,
        JSON.stringify(item.options)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(exportData, null, 2);
  }, [history, getHistoryStats]);

  return {
    // Generation functions
    generate,
    generateWithContext,
    batchGenerate,
    retryGeneration,
    
    // State
    isGenerating,
    modelStatus,
    
    // History management
    history,
    recentPrompts,
    clearHistory,
    getHistoryStats,
    exportHistory,
    
    // Utility
    canGenerate: modelStatus === 'ready'
  };
};