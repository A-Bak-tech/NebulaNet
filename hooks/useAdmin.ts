import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useAdmin = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getPlatformStats = async () => {
    setIsLoading(true);
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get post count
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get waitlist count
      const { count: waitlistCount } = await supabase
        .from('waitlist_entries')
        .select('*', { count: 'exact', head: true });

      // Get today's posts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        userCount,
        postCount,
        waitlistCount,
        todayPosts,
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('type, success, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process AI metrics
      const metrics = {
        totalRequests: data.length,
        successRate: data.filter(log => log.success).length / data.length,
        byType: data.reduce((acc, log) => {
          acc[log.type] = (acc[log.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return metrics;
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      throw error;
    }
  };

  useEffect(() => {
    getPlatformStats();
  }, []);

  return {
    stats,
    isLoading,
    getPlatformStats,
    getAIMetrics,
  };
};