import React, { createContext, useContext, useReducer } from 'react';
import { AppState } from '@/types/app';

type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_AI_ENHANCEMENT'; payload: boolean }
  | { type: 'SET_DATA_SAVER'; payload: boolean };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'SET_AI_ENHANCEMENT':
      return { ...state, aiEnhancement: action.payload };
    case 'SET_DATA_SAVER':
      return { ...state, dataSaver: action.payload };
    default:
      return state;
  }
};

const initialState: AppState = {
  theme: 'light',
  notifications: true,
  aiEnhancement: true,
  dataSaver: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};