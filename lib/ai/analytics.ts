import { supabase } from '../supabase';

export interface AIPerformanceMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  requestsByType: Record<string, number>;
  accuracy: number;
}

export interface AIUsageStats {
  dailyRequests: number;
  weeklyGrowth: number;
  popularFeatures: Array<{
    feature: string;
    usage: number;
    growth: number;
  }>;
  userEngagement: {
    activeUsers: number;
    retentionRate: number;
    averageSession: number;
  };
}

export const aiAnalytics = {
  async getPerformanceMetrics(days: number = 7): Promise<AIPerformanceMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ai_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const logs = data || [];
    const totalRequests = logs.length;
    const successfulRequests = logs.filter(log => log.success).length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    // Calculate average response time (simulated)
    const averageResponseTime = 450; // ms

    // Group by type
    const requestsByType = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate accuracy (simulated)
    const accuracy = 0.94;

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      requestsByType,
      accuracy,
    };
  },

  async getUsageStats(): Promise<AIUsageStats> {
    // Simulate usage stats - replace with actual analytics
    return {
      dailyRequests: 1247,
      weeklyGrowth: 12.5,
      popularFeatures: [
        { feature: 'content_enhancement', usage: 567, growth: 8.2 },
        { feature: 'moderation', usage: 432, growth: 15.7 },
        { feature: 'suggestions', usage: 248, growth: 23.1 },
      ],
      userEngagement: {
        activeUsers: 2341,
        retentionRate: 0.78,
        averageSession: 4.2, // minutes
      },
    };
  },

  async getUserBehaviorPatterns(): Promise<any> {
    // Analyze user behavior patterns
    const { data: posts } = await supabase
      .from('posts')
      .select('created_at, ai_enhanced, likes_count, comments_count')
      .order('created_at', { ascending: false })
      .limit(1000);

    const patterns = {
      peakHours: [9, 14, 19, 21], // hours with most activity
      aiAdoptionRate: posts ? posts.filter(p => p.ai_enhanced).length / posts.length : 0,
      engagementByAIFeature: {
        enhanced: posts ? posts.filter(p => p.ai_enhanced).reduce((acc, p) => acc + p.likes_count + p.comments_count, 0) : 0,
        regular: posts ? posts.filter(p => !p.ai_enhanced).reduce((acc, p) => acc + p.likes_count + p.comments_count, 0) : 0,
      },
    };

    return patterns;
  },

  async logFeatureUsage(feature: string, userId: string, success: boolean): Promise<void> {
    await supabase.from('ai_usage_logs').insert([{
      feature,
      user_id: userId,
      success,
      created_at: new Date().toISOString(),
    }]);
  },
};