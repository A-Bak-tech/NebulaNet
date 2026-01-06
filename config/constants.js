// config/constants.js
export const APP_CONFIG = {
  name: 'NebulaNet',
  version: '1.0.0',
  build: '1',
  scheme: 'nebulanet',
  website: 'https://nebulanet.space',
  supportEmail: 'support@nebulanet.space',
  privacyPolicy: 'https://nebulanet.space/privacy',
  termsOfService: 'https://nebulanet.space/terms',
};

export const COLORS = {
  // Primary
  primary: '#1DA1F2',
  primaryLight: '#8ED0F9',
  primaryDark: '#1A8CD8',
  
  // Secondary
  secondary: '#657786',
  secondaryLight: '#AAB8C2',
  secondaryDark: '#14171A',
  
  // Background
  background: '#FFFFFF',
  surface: '#F7F9FA',
  card: '#FFFFFF',
  
  // Text
  text: {
    primary: '#15202B',
    secondary: '#657786',
    light: '#AAB8C2',
    inverse: '#FFFFFF',
  },
  
  // Status
  success: '#06D6A0',
  error: '#EF476F',
  warning: '#FFD166',
  info: '#118AB2',
  
  // Social
  facebook: '#1877F2',
  google: '#DB4437',
  apple: '#000000',
  
  // Gradients
  gradients: {
    primary: ['#1DA1F2', '#1A8CD8'],
    sunset: ['#FF6B6B', '#FFD166', '#06D6A0'],
  },
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  endpoints: {
    auth: {
      login: '/auth/v1/token',
      signup: '/auth/v1/signup',
      logout: '/auth/v1/logout',
      refresh: '/auth/v1/token/refresh',
    },
    posts: {
      feed: '/rest/v1/posts',
      create: '/rest/v1/posts',
      like: '/rest/v1/likes',
      comment: '/rest/v1/comments',
    },
    users: {
      profile: '/rest/v1/profiles',
      follow: '/rest/v1/user_follows',
    },
    communities: {
      list: '/rest/v1/communities',
      join: '/rest/v1/community_members',
    },
  },
};

export const STORAGE_KEYS = {
  auth: {
    session: '@NebulaNet:session',
    user: '@NebulaNet:user',
    token: '@NebulaNet:token',
  },
  preferences: {
    theme: '@NebulaNet:theme',
    language: '@NebulaNet:language',
    notifications: '@NebulaNet:notifications',
  },
  cache: {
    feed: '@NebulaNet:feed_cache',
    profile: '@NebulaNet:profile_cache',
    communities: '@NebulaNet:communities_cache',
  },
};

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  MESSAGE: 'message',
  COMMUNITY: 'community',
  SYSTEM: 'system',
};

export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  POLL: 'poll',
  LINK: 'link',
};

export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

export const COMMUNITY_ROLES = {
  MEMBER: 'member',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

// Validation constants
export const VALIDATION = {
  username: {
    min: 3,
    max: 30,
    regex: /^[a-zA-Z0-9_.]+$/,
  },
  password: {
    min: 8,
    max: 100,
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    regex: /^\+?[1-9]\d{1,14}$/,
  },
};

// App limits
export const LIMITS = {
  posts: {
    maxLength: 10000,
    maxImages: 10,
    maxVideos: 1,
    maxPollOptions: 6,
  },
  comments: {
    maxLength: 2000,
    maxDepth: 5,
  },
  messages: {
    maxLength: 5000,
  },
  uploads: {
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
};

// Feature flags
export const FEATURE_FLAGS = {
  enableChat: true,
  enableCommunities: true,
  enableNotifications: true,
  enableAnalytics: true,
  enableOfflineMode: false,
  enableDarkMode: true,
};