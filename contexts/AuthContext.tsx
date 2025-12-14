import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { User } from '../types/app';
import { authService } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Helper type for auth service responses
interface AuthSessionResponse {
  session: any;
  profile: User | null;
}

// Use your existing User type - it already has role
type AppUser = User & {
  is_active?: boolean;
};

interface AuthState {
  user: AppUser | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

interface AuthContextType extends AuthState {
  // Authentication
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    displayName?: string,
    waitlistId?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  
  // Session
  refreshSession: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  
  // Profile Management
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
  uploadProfilePicture: (file: File | Blob, fileName?: string) => Promise<string>;
  deleteProfilePicture: () => Promise<void>;
  
  // Password & Account
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  reactivateAccount: () => Promise<void>;
  
  // Waitlist
  joinWaitlist: (email: string, name?: string, reason?: string) => Promise<any>;
  checkWaitlistStatus: (email: string) => Promise<any>;
  
  // User Lookup
  getUserById: (userId: string) => Promise<AppUser>;
  getUserByUsername: (username: string) => Promise<AppUser>;
  searchUsers: (query: string, limit?: number) => Promise<AppUser[]>;
  
  // Permissions
  hasRole: (role: 'user' | 'moderator' | 'admin') => boolean;
  canAdmin: () => boolean;
  canModerate: () => boolean;
  
  // Utilities
  getUserId: () => string | null;
  isOwner: (resourceOwnerId: string) => boolean;
  getDisplayName: () => string;
  getAvatarUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    isModerator: false,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userProfile = await getUserProfile(session.user.id);
            if (userProfile) {
              setAuthState({
                user: userProfile,
                session,
                isLoading: false,
                isAuthenticated: true,
                isAdmin: userProfile.role === 'admin',
                isModerator: userProfile.role === 'moderator' || userProfile.role === 'admin',
              });
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
            isModerator: false,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const result = await authService.getCurrentSession();
      
      if (result.success && result.data) {
        const { session, profile } = result.data as AuthSessionResponse;
        if (profile) {
          const appUser: AppUser = {
            ...profile,
            is_active: (profile as any).is_active ?? true,
          };
          
          setAuthState({
            user: appUser,
            session,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: appUser.role === 'admin',
            isModerator: appUser.role === 'moderator' || appUser.role === 'admin',
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const getUserProfile = async (userId: string): Promise<AppUser | null> => {
    try {
      const result = await authService.getUserById(userId);
      
      if (result.success && result.data) {
        const user = result.data as User;
        return {
          ...user,
          is_active: (user as any).is_active ?? true,
        };
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  };

  // ==================== AUTHENTICATION ====================

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.login(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      const { session, profile } = result.data as AuthSessionResponse;
      if (!profile) {
        throw new Error('No user profile returned');
      }

      const appUser: AppUser = {
        ...profile,
        is_active: (profile as any).is_active ?? true,
      };

      setAuthState({
        user: appUser,
        session,
        isLoading: false,
        isAuthenticated: true,
        isAdmin: appUser.role === 'admin',
        isModerator: appUser.role === 'moderator' || appUser.role === 'admin',
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string,
    displayName?: string,
    waitlistId?: string
  ) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.registerUser(
        email,
        password,
        username,
        displayName,
        waitlistId
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Auto-login after registration
      await login(email, password);
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.logout();
      
      if (!result.success) {
        throw new Error(result.error || 'Logout failed');
      }

      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
        isModerator: false,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // ==================== SESSION MANAGEMENT ====================

  const refreshSession = async () => {
    try {
      const result = await authService.refreshSession();
      
      if (!result.success) {
        throw new Error(result.error || 'Session refresh failed');
      }

      // Re-initialize auth state
      await initializeAuth();
    } catch (error: any) {
      throw error;
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const result = await authService.getCurrentSession();
      return result.success && !!result.data;
    } catch (error) {
      return false;
    }
  };

  // ==================== PROFILE MANAGEMENT ====================

  const updateProfile = async (updates: Partial<AppUser>) => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.updateProfile(authState.user.id, updates);
      
      if (!result.success) {
        throw new Error(result.error || 'Profile update failed');
      }

      setAuthState(prev => ({
        ...prev,
        user: { 
          ...prev.user!, 
          ...updates,
        },
        isLoading: false,
      }));
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const uploadProfilePicture = async (file: File | Blob, fileName?: string): Promise<string> => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.uploadProfilePicture(authState.user.id, file, fileName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload profile picture');
      }

      const avatarUrl = result.data || '';

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, avatar_url: avatarUrl },
        isLoading: false,
      }));

      return avatarUrl;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const deleteProfilePicture = async () => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.deleteProfilePicture(authState.user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete profile picture');
      }

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, avatar_url: null },
        isLoading: false,
      }));
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // ==================== PASSWORD & ACCOUNT ====================

  const resetPassword = async (email: string) => {
    try {
      const result = await authService.resetPassword(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const result = await authService.updatePassword(newPassword);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      const result = await authService.updateEmail(newEmail);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update email');
      }

      // Update local state
      if (authState.user) {
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user!, email: newEmail },
        }));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.deleteAccount(authState.user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }

      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
        isModerator: false,
      });
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const deactivateAccount = async () => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.deactivateAccount(authState.user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate account');
      }

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, is_active: false },
        isLoading: false,
      }));
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const reactivateAccount = async () => {
    try {
      if (!authState.user) throw new Error('No user logged in');
      
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authService.reactivateAccount(authState.user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reactivate account');
      }

      setAuthState(prev => ({
        ...prev,
        user: { ...prev.user!, is_active: true },
        isLoading: false,
      }));
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // ==================== WAITLIST ====================

  const joinWaitlist = async (email: string, name?: string, reason?: string) => {
    try {
      const result = await authService.joinWaitlist(email, name, reason);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join waitlist');
      }

      return result.data;
    } catch (error: any) {
      throw error;
    }
  };

  const checkWaitlistStatus = async (email: string) => {
    try {
      const result = await authService.checkWaitlistStatus(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to check waitlist status');
      }

      return result.data;
    } catch (error: any) {
      throw error;
    }
  };

  // ==================== USER LOOKUP ====================

  const getUserById = async (userId: string): Promise<AppUser> => {
    try {
      const result = await authService.getUserById(userId);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get user');
      }

      const user = result.data as User;
      return {
        ...user,
        is_active: (user as any).is_active ?? true,
      };
    } catch (error: any) {
      throw error;
    }
  };

  const getUserByUsername = async (username: string): Promise<AppUser> => {
    try {
      const result = await authService.getUserByUsername(username);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get user');
      }

      const user = result.data as User;
      return {
        ...user,
        is_active: (user as any).is_active ?? true,
      };
    } catch (error: any) {
      throw error;
    }
  };

  const searchUsers = async (query: string, limit: number = 20): Promise<AppUser[]> => {
    try {
      const result = await authService.searchUsers(query, limit);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search users');
      }

      const users = (result.data || []) as User[];
      return users.map(user => ({
        ...user,
        is_active: (user as any).is_active ?? true,
      }));
    } catch (error: any) {
      throw error;
    }
  };

  // ==================== PERMISSIONS ====================

  const hasRole = (role: 'user' | 'moderator' | 'admin'): boolean => {
    return authState.user?.role === role;
  };

  const canAdmin = (): boolean => {
    // Check if user has admin role
    if (authState.user?.role === 'admin') return true;
    
    // Hardcoded admin check for you (the only admin)
    const adminEmails = ['your-admin-email@example.com'];
    const adminUserIds = ['your-user-id-here'];
    
    if (authState.user?.email && adminEmails.includes(authState.user.email)) return true;
    if (authState.user?.id && adminUserIds.includes(authState.user.id)) return true;
    
    return false;
  };

  const canModerate = (): boolean => {
    return authState.user?.role === 'moderator' || authState.user?.role === 'admin';
  };

  // ==================== UTILITIES ====================

  const getUserId = (): string | null => {
    return authState.user?.id || null;
  };

  const isOwner = (resourceOwnerId: string): boolean => {
    return authState.user?.id === resourceOwnerId;
  };

  const getDisplayName = (): string => {
    if (!authState.user) return 'Guest';
    return authState.user.display_name || authState.user.username || 'User';
  };

  const getAvatarUrl = (): string => {
    if (!authState.user) return '';
    
    return (
      authState.user.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        getDisplayName()
      )}&background=random&color=fff&bold=true`
    );
  };

  const value: AuthContextType = {
    // State
    ...authState,
    
    // Authentication
    login,
    register,
    logout,
    
    // Session
    refreshSession,
    checkAuthStatus,
    
    // Profile Management
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    
    // Password & Account
    resetPassword,
    updatePassword,
    updateEmail,
    deleteAccount,
    deactivateAccount,
    reactivateAccount,
    
    // Waitlist
    joinWaitlist,
    checkWaitlistStatus,
    
    // User Lookup
    getUserById,
    getUserByUsername,
    searchUsers,
    
    // Permissions
    hasRole,
    canAdmin,
    canModerate,
    
    // Utilities
    getUserId,
    isOwner,
    getDisplayName,
    getAvatarUrl,
  };

  if (authState.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};