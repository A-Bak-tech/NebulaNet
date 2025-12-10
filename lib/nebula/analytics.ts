export interface AnalyticsEvent {
  id: string;
  type: 'text_generation' | 'sentiment_analysis' | 'content_moderation' | 'enhancement' | 'training';
  timestamp: Date;
  userId?: string;
  duration: number;
  success: boolean;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
  latency: {
    p50: number;
    p90: number;
    p99: number;
    avg: number;
  };
  accuracy: number;
  throughput: number; // requests per minute
  errorRate: number;
  modelSize: number;
  memoryUsage: number;
}

export interface UsageAnalytics {
  totalRequests: number;
  uniqueUsers: number;
  peakHour: number;
  averageResponseTime: number;
  mostUsedFeature: string;
  geographicDistribution: Record<string, number>;
}

export class NebulaAnalytics {
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private usageStats: UsageAnalytics = {
    totalRequests: 0,
    uniqueUsers: 0,
    peakHour: 0,
    averageResponseTime: 0,
    mostUsedFeature: '',
    geographicDistribution: {}
  };
  
  private uniqueUserIds = new Set<string>();
  private hourCounts = new Array(24).fill(0);
  private featureCounts: Record<string, number> = {};
  
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): string {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullEvent: AnalyticsEvent = {
      ...event,
      id,
      timestamp: new Date()
    };
    
    this.events.push(fullEvent);
    
    // Update usage statistics
    this.updateUsageStats(fullEvent);
    
    return id;
  }
  
  private updateUsageStats(event: AnalyticsEvent): void {
    // Update total requests
    this.usageStats.totalRequests++;
    
    // Update unique users
    if (event.userId) {
      this.uniqueUserIds.add(event.userId);
      this.usageStats.uniqueUsers = this.uniqueUserIds.size;
    }
    
    // Update hour distribution
    const hour = event.timestamp.getHours();
    this.hourCounts[hour]++;
    
    // Find peak hour
    const maxCount = Math.max(...this.hourCounts);
    this.usageStats.peakHour = this.hourCounts.indexOf(maxCount);
    
    // Update feature usage
    this.featureCounts[event.type] = (this.featureCounts[event.type] || 0) + 1;
    
    // Find most used feature
    let maxFeature = '';
    let maxCount = 0;
    for (const [feature, count] of Object.entries(this.featureCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxFeature = feature;
      }
    }
    this.usageStats.mostUsedFeature = maxFeature;
    
    // Update average response time
    const totalTime = this.events.reduce((sum, e) => sum + e.duration, 0);
    this.usageStats.averageResponseTime = totalTime / this.events.length;
  }
  
  trackPerformance(metrics: Omit<PerformanceMetrics, 'modelSize' | 'memoryUsage'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      modelSize: this.getModelSize(),
      memoryUsage: this.getMemoryUsage()
    };
    
    this.performanceMetrics.push(fullMetrics);
    
    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }
  
  private getModelSize(): number {
    // Estimate model size in MB
    return 250; // Example: 250MB for medium model
  }
  
  private getMemoryUsage(): number {
    // Get current memory usage in MB
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }
  
  getAnalytics(timeRange?: { start: Date; end: Date }): {
    events: AnalyticsEvent[];
    performance: PerformanceMetrics[];
    usage: UsageAnalytics;
    insights: string[];
  } {
    let filteredEvents = this.events;
    
    if (timeRange) {
      filteredEvents = this.events.filter(event => 
        event.timestamp >= timeRange.start && 
        event.timestamp <= timeRange.end
      );
    }
    
    const insights = this.generateInsights(filteredEvents);
    
    return {
      events: filteredEvents,
      performance: this.performanceMetrics,
      usage: this.usageStats,
      insights
    };
  }
  
  private generateInsights(events: AnalyticsEvent[]): string[] {
    const insights: string[] = [];
    
    if (events.length === 0) return insights;
    
    // Calculate success rate
    const successfulEvents = events.filter(e => e.success);
    const successRate = (successfulEvents.length / events.length) * 100;
    
    insights.push(`Success rate: ${successRate.toFixed(1)}%`);
    
    // Find busiest time
    const hourCounts = new Array(24).fill(0);
    events.forEach(event => {
      hourCounts[event.timestamp.getHours()]++;
    });
    
    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    insights.push(`Peak usage hour: ${maxHour}:00`);
    
    // Most common feature
    const featureCounts: Record<string, number> = {};
    events.forEach(event => {
      featureCounts[event.type] = (featureCounts[event.type] || 0) + 1;
    });
    
    const mostUsed = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostUsed) {
      insights.push(`Most used feature: ${mostUsed[0]} (${mostUsed[1]} requests)`);
    }
    
    // Average response time
    const avgTime = events.reduce((sum, e) => sum + e.duration, 0) / events.length;
    insights.push(`Average response time: ${avgTime.toFixed(0)}ms`);
    
    // Error patterns
    const errorEvents = events.filter(e => !e.success);
    if (errorEvents.length > 0) {
      const errorRate = (errorEvents.length / events.length) * 100;
      insights.push(`Error rate: ${errorRate.toFixed(1)}%`);
      
      // Group errors by type
      const errorTypes: Record<string, number> = {};
      errorEvents.forEach(event => {
        const errorType = event.metadata.errorType || 'unknown';
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });
      
      const commonError = Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (commonError) {
        insights.push(`Most common error: ${commonError[0]}`);
      }
    }
    
    // Performance trends
    if (this.performanceMetrics.length > 1) {
      const recentMetrics = this.performanceMetrics.slice(-10);
      const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency.avg, 0) / recentMetrics.length;
      insights.push(`Recent average latency: ${avgLatency.toFixed(0)}ms`);
      
      // Check if latency is increasing
      if (recentMetrics.length >= 2) {
        const first = recentMetrics[0].latency.avg;
        const last = recentMetrics[recentMetrics.length - 1].latency.avg;
        const change = ((last - first) / first) * 100;
        
        if (Math.abs(change) > 10) {
          insights.push(`Latency trend: ${change > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(change).toFixed(1)}%`);
        }
      }
    }
    
    return insights;
  }
  
  getPerformanceReport(): {
    current: PerformanceMetrics | null;
    trends: {
      latency: number[];
      accuracy: number[];
      errorRate: number[];
    };
    recommendations: string[];
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        current: null,
        trends: { latency: [], accuracy: [], errorRate: [] },
        recommendations: ['No performance data available']
      };
    }
    
    const current = this.performanceMetrics[this.performanceMetrics.length - 1];
    
    // Extract trends (last 50 data points)
    const recentMetrics = this.performanceMetrics.slice(-50);
    const trends = {
      latency: recentMetrics.map(m => m.latency.avg),
      accuracy: recentMetrics.map(m => m.accuracy),
      errorRate: recentMetrics.map(m => m.errorRate)
    };
    
    const recommendations = this.generatePerformanceRecommendations(current, trends);
    
    return {
      current,
      trends,
      recommendations
    };
  }
  
  private generatePerformanceRecommendations(
    current: PerformanceMetrics,
    trends: { latency: number[]; accuracy: number[]; errorRate: number[] }
  ): string[] {
    const recommendations: string[] = [];
    
    // Latency recommendations
    if (current.latency.avg > 1000) {
      recommendations.push('High latency detected. Consider optimizing model or adding caching.');
    } else if (current.latency.avg > 500) {
      recommendations.push('Moderate latency. Monitor performance.');
    }
    
    // Accuracy recommendations
    if (current.accuracy < 0.8) {
      recommendations.push('Low accuracy. Consider retraining model with more data.');
    } else if (current.accuracy < 0.9) {
      recommendations.push('Accuracy could be improved. Fine-tuning recommended.');
    }
    
    // Error rate recommendations
    if (current.errorRate > 0.1) {
      recommendations.push('High error rate. Check model stability and input validation.');
    } else if (current.errorRate > 0.05) {
      recommendations.push('Moderate error rate. Monitor for patterns.');
    }
    
    // Trend-based recommendations
    if (trends.latency.length >= 2) {
      const firstLatency = trends.latency[0];
      const lastLatency = trends.latency[trends.latency.length - 1];
      const latencyIncrease = ((lastLatency - firstLatency) / firstLatency) * 100;
      
      if (latencyIncrease > 20) {
        recommendations.push(`Latency increasing trend: +${latencyIncrease.toFixed(1)}%. Investigate resource usage.`);
      }
    }
    
    if (trends.accuracy.length >= 2) {
      const firstAccuracy = trends.accuracy[0];
      const lastAccuracy = trends.accuracy[trends.accuracy.length - 1];
      const accuracyDecrease = ((firstAccuracy - lastAccuracy) / firstAccuracy) * 100;
      
      if (accuracyDecrease > 10) {
        recommendations.push(`Accuracy decreasing trend: -${accuracyDecrease.toFixed(1)}%. Model may need updating.`);
      }
    }
    
    // Memory recommendations
    if (current.memoryUsage > 500) {
      recommendations.push(`High memory usage: ${current.memoryUsage}MB. Consider memory optimization.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges.');
    }
    
    return recommendations;
  }
  
  getUserAnalytics(userId: string): {
    totalRequests: number;
    favoriteFeatures: Array<{ feature: string; count: number }>;
    averageResponseTime: number;
    successRate: number;
    recentActivity: AnalyticsEvent[];
  } {
    const userEvents = this.events.filter(event => event.userId === userId);
    
    if (userEvents.length === 0) {
      return {
        totalRequests: 0,
        favoriteFeatures: [],
        averageResponseTime: 0,
        successRate: 0,
        recentActivity: []
      };
    }
    
    // Calculate favorite features
    const featureCounts: Record<string, number> = {};
    userEvents.forEach(event => {
      featureCounts[event.type] = (featureCounts[event.type] || 0) + 1;
    });
    
    const favoriteFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate success rate
    const successfulEvents = userEvents.filter(e => e.success);
    const successRate = (successfulEvents.length / userEvents.length) * 100;
    
    // Calculate average response time
    const avgResponseTime = userEvents.reduce((sum, e) => sum + e.duration, 0) / userEvents.length;
    
    // Get recent activity (last 10 events)
    const recentActivity = userEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    return {
      totalRequests: userEvents.length,
      favoriteFeatures,
      averageResponseTime: avgResponseTime,
      successRate,
      recentActivity
    };
  }
  
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      usageStats: this.usageStats,
      exportTimestamp: new Date().toISOString()
    };
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  private convertToCSV(data: any): string {
    // Simple CSV conversion for events
    const events = data.events;
    if (events.length === 0) return '';
    
    const headers = Object.keys(events[0]).join(',');
    const rows = events.map((event: any) => 
      Object.values(event).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  }
  
  clearData(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.usageStats = {
      totalRequests: 0,
      uniqueUsers: 0,
      peakHour: 0,
      averageResponseTime: 0,
      mostUsedFeature: '',
      geographicDistribution: {}
    };
    this.uniqueUserIds.clear();
    this.hourCounts.fill(0);
    this.featureCounts = {};
  }
  
  async saveToStorage(): Promise<void> {
    const data = {
      events: this.events,
      performanceMetrics: this.performanceMetrics,
      usageStats: this.usageStats,
      uniqueUserIds: Array.from(this.uniqueUserIds),
      hourCounts: this.hourCounts,
      featureCounts: this.featureCounts,
      savedAt: new Date().toISOString()
    };
    
    // Save to AsyncStorage in React Native
    const key = 'nebula_analytics';
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }
  
  async loadFromStorage(): Promise<void> {
    const key = 'nebula_analytics';
    const data = await AsyncStorage.getItem(key);
    
    if (data) {
      const parsed = JSON.parse(data);
      this.events = parsed.events.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }));
      this.performanceMetrics = parsed.performanceMetrics;
      this.usageStats = parsed.usageStats;
      this.uniqueUserIds = new Set(parsed.uniqueUserIds);
      this.hourCounts = parsed.hourCounts;
      this.featureCounts = parsed.featureCounts;
    }
  }
}