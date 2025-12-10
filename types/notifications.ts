// File: /types/notifications.ts
export type NotificationType = 
  | 'like_post'
  | 'comment_post'
  | 'reply_comment'
  | 'follow_user'
  | 'mention'
  | 'echo_post'
  | 'post_approved'
  | 'welcome'
  | 'trending'
  | 'weekly_digest'
  | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id?: string;
  target_id?: string;
  target_type?: 'post' | 'comment' | 'user';
  title?: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  
  // Joined data
  actor?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  [key: string]: {
    in_app: boolean;
    email: boolean;
    push: boolean;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  has_more: boolean;
  total: number;
}