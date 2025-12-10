import { supabase } from './supabase';
import { WaitlistEntry, CreateWaitlistInput, ApiResponse, PaginatedResponse } from '../types/app';

/**
 * Waitlist Management Service
 */

export const waitlistService = {
  /**
   * Add email to waitlist
   */
  addToWaitlist: async (input: CreateWaitlistInput): Promise<ApiResponse<WaitlistEntry>> => {
    try {
      const { email, name, reason, referral_code } = input;

      // Check if email already exists
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

      // Generate referral code if not provided
      const finalReferralCode = referral_code || generateReferralCode();

      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          email,
          name,
          reason,
          referral_code: finalReferralCode,
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
      console.error('Add to waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to join waitlist',
      };
    }
  },

  /**
   * Get waitlist entry by email
   */
  getByEmail: async (email: string): Promise<ApiResponse<WaitlistEntry>> => {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('Get waitlist entry error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get waitlist entry',
      };
    }
  },

  /**
   * Get all waitlist entries (admin only)
   */
  getAll: async (
    page: number = 1,
    limit: number = 50,
    invitedOnly: boolean = false
  ): Promise<ApiResponse<PaginatedResponse<WaitlistEntry>>> => {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('waitlist')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (invitedOnly) {
        query = query.eq('is_invited', true);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
          page,
          limit,
          total: count || 0,
          has_more: (data?.length || 0) === limit,
        },
      };
    } catch (error: any) {
      console.error('Get all waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get waitlist',
      };
    }
  },

  /**
   * Mark waitlist entry as invited
   */
  inviteUser: async (waitlistId: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({
          is_invited: true,
          invited_at: new Date().toISOString(),
        })
        .eq('id', waitlistId);

      if (error) throw error;

      return {
        success: true,
        message: 'User invited successfully',
      };
    } catch (error: any) {
      console.error('Invite user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to invite user',
      };
    }
  },

  /**
   * Remove from waitlist
   */
  removeFromWaitlist: async (waitlistId: string): Promise<ApiResponse> => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistId);

      if (error) throw error;

      return {
        success: true,
        message: 'Removed from waitlist',
      };
    } catch (error: any) {
      console.error('Remove from waitlist error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove from waitlist',
      };
    }
  },

  /**
   * Get waitlist statistics
   */
  getStatistics: async (): Promise<ApiResponse> => {
    try {
      // Get total count
      const { count: total } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      // Get invited count
      const { count: invited } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_invited', true);

      // Get recent signups (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: recent } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      return {
        success: true,
        data: {
          total: total || 0,
          invited: invited || 0,
          pending: (total || 0) - (invited || 0),
          recent: recent || 0,
          conversion_rate: total ? ((invited || 0) / total) * 100 : 0,
        },
      };
    } catch (error: any) {
      console.error('Get waitlist stats error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get waitlist statistics',
      };
    }
  },

  /**
   * Check if user can sign up (if waitlist is required)
   */
  canUserSignUp: async (email: string): Promise<ApiResponse<{ canSignUp: boolean; reason?: string }>> => {
    try {
      // If waitlist is not required in beta, allow all
      if (process.env.EXPO_PUBLIC_BETA_MODE !== 'true' || 
          process.env.EXPO_PUBLIC_REQUIRE_WAITLIST_APPROVAL !== 'true') {
        return {
          success: true,
          data: { canSignUp: true },
        };
      }

      // Check if email is in waitlist and invited
      const { data: waitlistEntry } = await supabase
        .from('waitlist')
        .select('is_invited')
        .eq('email', email)
        .single();

      if (!waitlistEntry) {
        return {
          success: true,
          data: {
            canSignUp: false,
            reason: 'Email not found in waitlist',
          },
        };
      }

      return {
        success: true,
        data: {
          canSignUp: waitlistEntry.is_invited,
          reason: waitlistEntry.is_invited ? undefined : 'Not yet invited from waitlist',
        },
      };
    } catch (error: any) {
      console.error('Check user sign up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check sign up eligibility',
      };
    }
  },
};

/**
 * Generate referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `NEBULA-${code}`;
}

export default waitlistService;