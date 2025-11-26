export type User = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  waitlist_position?: number;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  ai_enhanced: boolean;
  ai_analysis?: any;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_public: boolean;
  status: 'published' | 'draft' | 'pending' | 'flagged';
  created_at: string;
  updated_at: string;
  user?: User;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
};

export type Like = {
  id: string;
  post_id?: string;
  comment_id?: string;
  user_id: string;
  created_at: string;
};

export type WaitlistEntry = {
  id: string;
  email: string;
  position: number;
  status: 'pending' | 'approved' | 'rejected';
  referred_by?: string;
  created_at: string;
  approved_at?: string;
};

export type AILog = {
  id: string;
  type: 'enhancement' | 'moderation' | 'suggestion';
  input: any;
  output: any;
  success: boolean;
  error?: string;
  created_at: string;
};