import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NebulaAI } from '@/lib/nebula';

interface NebulaContextType {
  // AI Features
  generateText: (prompt: string, options?: any) => Promise<string>;
  enhanceContent: (content: string, options?: any) => Promise<any>;
  moderateContent: (content: string) => Promise<any>;
  analyzeSentiment: (content: string) => Promise<any>;
  getSuggestions: (content: string, options?: any) => Promise<any[]>;
  
  // Model Management
  trainModel: (data: any[], options?: any) => Promise<any>;
  evaluateModel: (modelId: string) => Promise<any>;
  getTrainedModels: () => any[];
  
  // Analytics
  getAnalytics: () => any;
  getPerformanceReport: () => any;
  
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Settings
  settings: NebulaSettings;
  updateSettings: (settings: Partial<NebulaSettings>) => void;
}

interface NebulaSettings {
  autoEnhance: boolean;
  autoModerate: boolean;
  creativityLevel: number;
  moderationStrictness: 'low' | 'medium' | 'high';
  theme: 'light' | 'dark' | 'auto';
  suggestionsEnabled: boolean;
}

const defaultSettings: NebulaSettings = {
  autoEnhance: false,
  autoModerate: true,
  creativityLevel: 0.7,
  moderationStrictness: 'medium',
  theme: 'auto',
  suggestionsEnabled: true
};

const NebulaContext = createContext<NebulaContextType | undefined>(undefined);

export const useNebula = () => {
  const context = useContext(NebulaContext);
  if (!context) {
    throw new Error('useNebula must be used within a NebulaProvider');
  }
  return context;
};

interface NebulaProviderProps {
  children: ReactNode;
}

export const NebulaProvider: React.FC<NebulaProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NebulaSettings>(defaultSettings);
  const [trainedModels, setTrainedModels] = useState<any[]>([]);

  // Initialize Nebula AI
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const nebula = NebulaAI.getInstance();
        await nebula.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize AI');
        console.error('Nebula AI initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load from AsyncStorage
        const saved = await AsyncStorage.getItem('nebula_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = async (newSettings: NebulaSettings) => {
    try {
      await AsyncStorage.setItem('nebula_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = (newSettings: Partial<NebulaSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // Wrapper functions for Nebula AI
  const generateText = async (prompt: string, options?: any): Promise<string> => {
    if (!isInitialized) {
      throw new Error('Nebula AI is not initialized');
    }

    try {
      const nebula = NebulaAI.getInstance();
      return await nebula.generateText(prompt, options);
    } catch (error) {
      console.error('Text generation error:', error);
      throw error;
    }
  };

  const enhanceContent = async (content: string, options?: any): Promise<any> => {
    if (!isInitialized) {
      throw new Error('Nebula AI is not initialized');
    }

    try {
      const nebula = NebulaAI.getInstance();
      return await nebula.enhanceContent(content, options);
    } catch (error) {
      console.error('Content enhancement error:', error);
      throw error;
    }
  };

  const moderateContent = async (content: string): Promise<any> => {
    if (!isInitialized) {
      throw new Error('Nebula AI is not initialized');
    }

    try {
      const nebula = NebulaAI.getInstance();
      return await nebula.moderateContent(content, {
        strictness: settings.moderationStrictness
      });
    } catch (error) {
      console.error('Content moderation error:', error);
      throw error;
    }
  };

  const analyzeSentiment = async (content: string): Promise<any> => {
    if (!isInitialized) {
      throw new Error('Nebula AI is not initialized');
    }

    try {
      const nebula = NebulaAI.getInstance();
      return await nebula.analyzeSentiment(content);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  };

  const getSuggestions = async (content: string, options?: any): Promise<any[]> => {
    if (!isInitialized || !settings.suggestionsEnabled) {
      return [];
    }

    try {
      const nebula = NebulaAI.getInstance();
      return await nebula.getSuggestions(content, {
        creativity: settings.creativityLevel,
        ...options
      });
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  };

  const trainModel = async (data: any[], options?: any): Promise<any> => {
    if (!isInitialized) {
      throw new Error('Nebula AI is not initialized');
    }

    try {
      const nebula = NebulaAI.getInstance();
      const result = await nebula.trainModel(data, options);
      
      // Update trained models list
      setTrainedModels(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      console.error('Model training error:', error);
      throw error;
    }
  };

  const evaluateModel = async (modelId: string): Promise<any> => {
    // Implementation would evaluate the model
    return {
      accuracy: 0.85,
      metrics: {},
      recommendations: []
    };
  };

  const getTrainedModels = (): any[] => {
    return trainedModels;
  };

  const getAnalytics = (): any => {
    if (!isInitialized) return null;
    
    const nebula = NebulaAI.getInstance();
    return nebula.getAnalytics();
  };

  const getPerformanceReport = (): any => {
    if (!isInitialized) return null;
    
    const nebula = NebulaAI.getInstance();
    return nebula.getPerformanceReport();
  };

  const value: NebulaContextType = {
    // AI Features
    generateText,
    enhanceContent,
    moderateContent,
    analyzeSentiment,
    getSuggestions,
    
    // Model Management
    trainModel,
    evaluateModel,
    getTrainedModels,
    
    // Analytics
    getAnalytics,
    getPerformanceReport,
    
    // State
    isInitialized,
    isLoading,
    error,
    
    // Settings
    settings,
    updateSettings
  };

  return (
    <NebulaContext.Provider value={value}>
      {children}
    </NebulaContext.Provider>
  );
};

// Higher-order component for easy usage
export const withNebula = <P extends object>(
  Component: React.ComponentType<P & { nebula: NebulaContextType }>
) => {
  return function WithNebulaComponent(props: P) {
    const nebula = useNebula();
    return <Component {...props} nebula={nebula} />;
  };
};

// Hook for auto-enhancement based on settings
export const useAutoEnhance = (content: string) => {
  const { settings, enhanceContent } = useNebula();
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const autoEnhance = async () => {
      if (settings.autoEnhance && content.trim()) {
        setIsEnhancing(true);
        try {
          const result = await enhanceContent(content, {
            style: 'professional',
            creativity: settings.creativityLevel
          });
          setEnhanced(result.enhanced);
        } catch (error) {
          console.error('Auto-enhance failed:', error);
        } finally {
          setIsEnhancing(false);
        }
      }
    };

    autoEnhance();
  }, [content, settings.autoEnhance]);

  return { enhanced, isEnhancing };
};

// Hook for real-time moderation
export const useRealTimeModeration = (content: string) => {
  const { settings, moderateContent } = useNebula();
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [isModerating, setIsModerating] = useState(false);

  useEffect(() => {
    const moderate = async () => {
      if (settings.autoModerate && content.trim()) {
        setIsModerating(true);
        try {
          const result = await moderateContent(content);
          setModerationResult(result);
        } catch (error) {
          console.error('Real-time moderation failed:', error);
        } finally {
          setIsModerating(false);
        }
      }
    };

    const timeoutId = setTimeout(moderate, 1000);
    return () => clearTimeout(timeoutId);
  }, [content, settings.autoModerate]);

  return { moderationResult, isModerating };
};