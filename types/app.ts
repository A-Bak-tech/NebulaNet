import { Database } from './database';

// User types
export type User = Database['public']['Tables']['users']['Row'] & {
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
};

export type UserProfile = User & {
  is_following?: boolean;
  is_followed_by?: boolean;
};

// Post types
export type Post = Database['public']['Tables']['posts']['Row'] & {
  user?: Pick<User, 'id' | 'username' | 'avatar_url' | 'display_name'>;
  comments?: Comment[];
  is_liked?: boolean;
  is_saved?: boolean;
};

export type CreatePostInput = {
  content: string;
  media_urls?: string[];
  tags?: string[];
  visibility?: 'public' | 'private' | 'friends';
  use_nebula?: boolean;
};

// Comment types
export type Comment = Database['public']['Tables']['comments']['Row'] & {
  user?: Pick<User, 'id' | 'username' | 'avatar_url'>;
  replies?: Comment[];
  is_liked?: boolean;
};

// Waitlist types
export type WaitlistEntry = Database['public']['Tables']['waitlist']['Row'];

export type CreateWaitlistInput = {
  email: string;
  name?: string;
  reason?: string;
  referral_code?: string;
};

// Nebula AI types
export type NebulaModel = Database['public']['Tables']['nebula_models']['Row'];

export type TextGenerationRequest = {
  prompt: string;
  max_length?: number;
  temperature?: number;
  model_version?: string;
};

export type TextGenerationResponse = {
  text: string;
  tokens_generated: number;
  inference_time: number;
  model_used: string;
};

export type ContentEnhancementRequest = {
  original_text: string;
  enhancement_type: 'grammar' | 'clarity' | 'creativity' | 'expansion';
  strength?: number;
};

export type ContentModerationResult = {
  is_approved: boolean;
  flags: string[];
  confidence: number;
  reason?: string;
};

// App state types
export type AppState = {
  isOnline: boolean;
  isLoading: boolean;
  lastSync: Date | null;
  notificationsCount: number;
};

export type Theme = 'light' | 'dark' | 'system';

// API Response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

// Component props types
export type WithChildren = {
  children: React.ReactNode;
};

export type WithClassName = {
  className?: string;
};

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Waitlist: undefined;
  Profile: { userId?: string };
  PostDetail: { postId: string };
  Admin: undefined;
  NebulaDashboard: undefined;
  Settings: undefined;
};

// Tab navigation types
export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};