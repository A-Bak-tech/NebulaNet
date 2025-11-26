import React, { createContext, useContext, useReducer } from 'react';
import { AISuggestion, ModerationResult } from '@/types/ai';

interface AIState {
  isProcessing: boolean;
  lastEnhancement?: string;
  suggestions: AISuggestion[];
  moderationResults: Record<string, ModerationResult>;
  usage: {
    enhancements: number;
    suggestions: number;
    moderations: number;
  };
  settings: {
    autoEnhance: boolean;
    autoModerate: boolean;
    showSuggestions: boolean;
  };
}

type AIAction =
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ENHANCEMENT'; payload: string }
  | { type: 'SET_SUGGESTIONS'; payload: AISuggestion[] }
  | { type: 'SET_MODERATION_RESULT'; payload: { contentId: string; result: ModerationResult } }
  | { type: 'INCREMENT_USAGE'; payload: 'enhancements' | 'suggestions' | 'moderations' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AIState['settings']> };

const aiReducer = (state: AIState, action: AIAction): AIState => {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ENHANCEMENT':
      return { ...state, lastEnhancement: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'SET_MODERATION_RESULT':
      return {
        ...state,
        moderationResults: {
          ...state.moderationResults,
          [action.payload.contentId]: action.payload.result,
        },
      };
    case 'INCREMENT_USAGE':
      return {
        ...state,
        usage: {
          ...state.usage,
          [action.payload]: state.usage[action.payload] + 1,
        },
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    default:
      return state;
  }
};

const initialState: AIState = {
  isProcessing: false,
  suggestions: [],
  moderationResults: {},
  usage: {
    enhancements: 0,
    suggestions: 0,
    moderations: 0,
  },
  settings: {
    autoEnhance: true,
    autoModerate: true,
    showSuggestions: true,
  },
};

const AIContext = createContext<{
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
} | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  return (
    <AIContext.Provider value={{ state, dispatch }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within AIProvider');
  }
  return context;
};