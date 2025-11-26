import { supabase } from '../supabase';

export interface PlatformAnalytics {
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
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    averageSession: number;
  };
  ai: {
    enhancements: number;
    moderation: number;
    suggestions: number;
    accuracy: number;
  };
}

export const adminAnalytics = {
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // User analytics
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: newToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Content analytics
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: postsToday } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', today.toISOString());

    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    // Engagement analytics
    const { data: engagementData } = await supabase
      .from('posts')
      .select('likes_count, comments_count, shares_count');

    const engagement = engagementData?.reduce(
      (acc, post) => ({
        likes: acc.likes + post.likes_count,
        comments: acc.comments + post.comments_count,
        shares: acc.shares + post.shares_count,
      }),
      { likes: 0, comments: 0, shares: 0 }
    ) || { likes: 0, comments: 0, shares: 0 };

    // AI analytics
    const { data: aiLogs } = await supabase
      .from('ai_logs')
      .select('type, success')
      .gte('created_at', today.toISOString());

    const aiStats = aiLogs?.reduce(
      (acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        acc.total++;
        if (log.success) acc.successful++;
        return acc;
      },
      { total: 0, successful: 0 } as any
    ) || { total: 0, successful: 0 };

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        newToday: newToday || 0,
        growth: 12.5, // Simulated growth percentage
      },
      content: {
        totalPosts: totalPosts || 0,
        postsToday: postsToday || 0,
        totalComments: totalComments || 0,
        engagementRate: totalPosts ? (engagement.likes + engagement.comments) / totalPosts : 0,
      },
      engagement: {
        likes: engagement.likes,
        shares: engagement.shares,
        comments: engagement.comments,
        averageSession: 4.2, // Simulated average session in minutes
      },
      ai: {
        enhancements: aiStats.enhancement || 0,
        moderation: aiStats.moderation || 0,
        suggestions: aiStats.suggestions || 0,
        accuracy: aiStats.total ? aiStats.successful / aiStats.total : 0,
      },
    };
  },

  async getGrowthMetrics(days: number = 30): Promise<{
    date: string;
    users: number;
    posts: number;
    engagement: number;
  }[]> {
    // Simulate growth data - replace with actual time-series queries
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 20,
        posts: Math.floor(Math.random() * 100) + 30,
        engagement: Math.floor(Math.random() * 200) + 100,
      });
    }

    return data;
  },

  async getUserRetention(): Promise<{
    day1: number;
    day7: number;
    day30: number;
  }> {
    // Simulate retention data
    return {
      day1: 0.65, // 65% of users return after 1 day
      day7: 0.45, // 45% of users return after 7 days
      day30: 0.25, // 25% of users return after 30 days
    };
  },

  async getAIPerformance(): Promise<{
    responseTime: number;
    accuracy: number;
    usageByFeature: Record<string, number>;
    errorRate: number;
  }> {
    const { data: logs } = await supabase
      .from('ai_logs')
      .select('type, success, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const performance = {
      responseTime: 320, // ms - simulated
      accuracy: 0.94,
      usageByFeature: {} as Record<string, number>,
      errorRate: 0.03,
    };

    if (logs) {
      logs.forEach(log => {
        performance.usageByFeature[log.type] = (performance.usageByFeature[log.type] || 0) + 1;
      });

      const total = logs.length;
      const errors = logs.filter(log => !log.success).length;
      performance.errorRate = total > 0 ? errors / total : 0;
    }

    return performance;
  },
};