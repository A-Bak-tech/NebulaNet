import { supabase } from './supabase';
import { User, ApiResponse } from '../types/app';

/**
 * Authentication Service for NebulaNet
 * Handles user registration, login, session management, and waitlist
 */

// ==================== SESSION MANAGEMENT ====================

export const authService = {
  // ==================== WAITLIST FUNCTIONS ====================
  
  /**
   * Join the waitlist
   */
  joinWaitlist: async (email: string, name?: string, reason?: string): Promise<ApiResponse> => {
    try {
      // Check if email already exists in waitlist
      const { data: existing } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        return {
          success: false,
          error: 'Email already registered to waitlist',
        };
      }

      // Generate referral code
      const referralCode = generateReferralCode();

      // Add to waitlist
      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          email,
          name,
          reason,
          referral_code: referralCode,
          is_invited: false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Successfully joined waitlist!',
      };
    } catch (error: any) {
      console.error('Waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to join waitlist',
      };
    }
  },

  /**
   * Check waitlist status
   */
  checkWaitlistStatus: async (email: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        // If no record found, return success with null data
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: null,
          };
        }
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Check waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check waitlist status',
      };
    }
  },

  // ==================== USER REGISTRATION ====================

  /**
   * Register a new user (for invited users from waitlist)
   */
  registerUser: async (
    email: string,
    password: string,
    username: string,
    displayName?: string,
    waitlistId?: string
  ): Promise<ApiResponse> => {
    try {
      // Check if username is available
      const { data: usernameCheck } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (usernameCheck) {
        return {
          success: false,
          error: 'Username already taken',
        };
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user!.id,
          email,
          username,
          display_name: displayName,
          role: 'user',
          is_verified: false,
        });

      if (profileError) throw profileError;

      // Mark waitlist entry as invited if waitlistId provided
      if (waitlistId) {
        await supabase
          .from('waitlist')
          .update({
            invited_at: new Date().toISOString(),
            is_invited: true,
          })
          .eq('id', waitlistId);
      }

      return {
        success: true,
        data: authData.user,
        message: 'Account created successfully!',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Failed to register user',
      };
    }
  },

  // ==================== USER LOGIN ====================

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile
      const userProfile = await getUserProfile(data.user.id);

      return {
        success: true,
        data: {
          session: data.session,
          user: data.user,
          profile: userProfile,
        },
        message: 'Login successful!',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to login',
      };
    }
  },

  /**
   * Login with magic link (email)
   */
  loginWithMagicLink: async (email: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.EXPO_PUBLIC_WEB_URL}/auth/callback`,
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Magic link sent to your email!',
      };
    } catch (error: any) {
      console.error('Magic link error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send magic link',
      };
    }
  },

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Get current session
   */
  getCurrentSession: async (): Promise<ApiResponse> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        return {
          success: true,
          data: null,
        };
      }

      // Get user profile
      const userProfile = await getUserProfile(session.user.id);

      return {
        success: true,
        data: {
          session,
          profile: userProfile,
        },
      };
    } catch (error: any) {
      console.error('Get session error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get session',
      };
    }
  },

  /**
   * Refresh session
   */
  refreshSession: async (): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Refresh session error:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh session',
      };
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiResponse> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Failed to logout',
      };
    }
  },

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * Reset password
   */
  resetPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_WEB_URL}/auth/reset-password`,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset email sent!',
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reset email',
      };
    }
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch (error: any) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update password',
      };
    }
  },

  /**
   * Update email
   */
  updateEmail: async (newEmail: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      // Update email in users table
      const { error: profileError } = await supabase
        .from('users')
        .update({ email: newEmail })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      return {
        success: true,
        message: 'Email updated successfully! Check your new email for verification.',
      };
    } catch (error: any) {
      console.error('Update email error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update email',
      };
    }
  },

  // ==================== PROFILE MANAGEMENT ====================

  /**
   * Update user profile
   */
  updateProfile: async (
    userId: string,
    updates: Partial<User>
  ): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Profile updated successfully!',
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  },

  /**
   * Upload profile picture
   */
  uploadProfilePicture: async (
    userId: string,
    file: File | Blob,
    fileName?: string
  ): Promise<ApiResponse<string>> => {
    try {
      const finalFileName = fileName || `avatar_${userId}_${Date.now()}.jpg`;
      const filePath = `avatars/${userId}/${finalFileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      await supabase
        .from('users')
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return {
        success: true,
        data: urlData.publicUrl,
        message: 'Profile picture updated!',
      };
    } catch (error: any) {
      console.error('Upload profile picture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload profile picture',
      };
    }
  },

  /**
   * Delete profile picture
   */
  deleteProfilePicture: async (userId: string): Promise<ApiResponse> => {
    try {
      // Get current avatar URL
      const { data: user } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (user?.avatar_url) {
        // Extract file path from URL
        const url = new URL(user.avatar_url);
        const pathParts = url.pathname.split('/');
        const bucket = pathParts[1];
        const filePath = pathParts.slice(2).join('/');

        // Delete from storage
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
      }

      // Update user profile to remove avatar URL
      await supabase
        .from('users')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      return {
        success: true,
        message: 'Profile picture removed',
      };
    } catch (error: any) {
      console.error('Delete profile picture error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete profile picture',
      };
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user',
      };
    }
  },

  /**
   * Get user by username
   */
  getUserByUsername: async (username: string): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Get user by username error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user',
      };
    }
  },

  /**
   * Search users
   */
  searchUsers: async (
    query: string,
    limit: number = 20
  ): Promise<ApiResponse<User[]>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error: any) {
      console.error('Search users error:', error);
      return {
        success: false,
        error: error.message || 'Failed to search users',
      };
    }
  },

  // ==================== ACCOUNT MANAGEMENT ====================

  /**
   * Delete account
   */
  deleteAccount: async (userId: string): Promise<ApiResponse> => {
    try {
      // Delete user profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error: any) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  },

  /**
   * Deactivate account (soft delete)
   */
  deactivateAccount: async (userId: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Account deactivated',
      };
    } catch (error: any) {
      console.error('Deactivate account error:', error);
      return {
        success: false,
        error: error.message || 'Failed to deactivate account',
      };
    }
  },

  /**
   * Reactivate account
   */
  reactivateAccount: async (userId: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: true,
          deactivated_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Account reactivated',
      };
    } catch (error: any) {
      console.error('Reactivate account error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate account',
      };
    }
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get user profile by ID
 */
async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // User might not have a profile yet
      console.warn('User profile not found:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `NEBULA-${code}`;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters',
    };
  }

  if (username.length > 20) {
    return {
      valid: false,
      error: 'Username must be less than 20 characters',
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  // Check for reserved usernames
  const reserved = [
    'admin', 'administrator', 'mod', 'moderator',
    'support', 'help', 'contact', 'info',
    'system', 'root', 'guest', 'anonymous',
    'nebula', 'nebulanet', 'official',
  ];

  if (reserved.includes(username.toLowerCase())) {
    return {
      valid: false,
      error: 'This username is reserved',
    };
  }

  return { valid: true };
}

export default authService;