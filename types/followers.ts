// File: /types/followers.ts
export type FollowStatus = 'pending' | 'accepted' | 'rejected';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  updated_at: string;
  
  // Joined user data
  follower?: User;
  following?: User;
}

export interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_private: boolean;
  is_following?: boolean;
  follow_status?: FollowStatus;
}

// Update the main types index
// File: /types/index.ts
export * from './followers';
export * from './database';
export * from './app';
export * from './nebula';
export * from './admin';