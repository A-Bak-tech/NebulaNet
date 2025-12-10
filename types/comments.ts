// File: /types/comments.ts
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  media_urls?: string[];
  likes_count: number;
  replies_count: number;
  is_liked?: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
  
  replies?: Comment[];
}

export interface CommentInput {
  content: string;
  parent_id?: string;
  media_urls?: string[];
}

export interface CommentFilters {
  sort?: 'newest' | 'oldest' | 'most_liked';
  limit?: number;
  offset?: number;
}

// File: /types/posts.ts (extend existing)
export interface PostDetail extends Post {
  is_liked: boolean;
  is_echoed: boolean;
  is_bookmarked: boolean;
  can_comment: boolean;
  can_echo: boolean;
  comments_count: number;
  user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
    is_following?: boolean;
  };
  media?: Media[];
}

export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  width?: number;
  height?: number;
  thumbnail_url?: string;
  duration?: number;
}