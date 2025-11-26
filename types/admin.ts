export interface AdminStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    growth: number;
  };
  content: {
    totalPosts: number;
    postsToday: number;
    totalComments: number;
    engagementRate: number;
  };
  moderation: {
    pending: number;
    flagged: number;
    approvedToday: number;
    rejectedToday: number;
  };
  system: {
    uptime: number;
    performance: number;
    storage: number;
  };
}

export interface UserManagement {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'inactive';
  post_count: number;
  comment_count: number;
  joined_date: string;
  last_active?: string;
}

export interface ContentModerationItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  author: UserManagement;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flags: string[];
  created_at: string;
  ai_confidence?: number;
  moderation_notes?: string;
}

export interface WaitlistManagement {
  id: string;
  email: string;
  position: number;
  status: 'pending' | 'approved' | 'rejected';
  referred_by?: string;
  created_at: string;
  approved_at?: string;
  notes?: string;
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    connections: number;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
  };
  ai: {
    status: 'healthy' | 'degraded' | 'down';
    performance: number;
    queue: number;
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export type AdminPermission = 
  | 'view_dashboard'
  | 'manage_users'
  | 'moderate_content'
  | 'manage_waitlist'
  | 'view_analytics'
  | 'system_settings'
  | 'ai_management';