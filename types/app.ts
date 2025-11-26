import { User, Post, Comment } from './database';

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any | null;
};

export type FeedState = {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  lastCursor?: string;
};

export type AppState = {
  theme: 'light' | 'dark';
  notifications: boolean;
  aiEnhancement: boolean;
  dataSaver: boolean;
};