import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;     // Max requests per window
  message?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Too many requests, please try again later.',
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      ...config
    };
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
    retryAfter?: number;
  }> {
    const key = this.getStorageKey(identifier);
    const now = Date.now();
    
    // Load from storage
    let record = await this.loadRecord(key);
    
    if (!record || now >= record.resetTime) {
      // Create new window
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequestTime: now
      };
    }

    const remaining = Math.max(0, this.config.max - record.count - 1);
    const allowed = remaining >= 0;

    if (allowed) {
      record.count++;
      
      // Save updated record
      await this.saveRecord(key, record);
    } else {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        limit: this.config.max,
        retryAfter
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime: record.resetTime,
      limit: this.config.max
    };
  }

  async increment(identifier: string, success: boolean = true): Promise<void> {
    if ((this.config.skipFailedRequests && !success) || 
        (this.config.skipSuccessfulRequests && success)) {
      return;
    }

    const key = this.getStorageKey(identifier);
    const now = Date.now();
    
    let record = await this.loadRecord(key);
    
    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs,
        firstRequestTime: now
      };
    }

    record.count++;
    await this.saveRecord(key, record);
  }

  async getStatus(identifier: string): Promise<{
    current: number;
    remaining: number;
    resetTime: number;
    limit: number;
    windowMs: number;
  }> {
    const key = this.getStorageKey(identifier);
    const now = Date.now();
    
    const record = await this.loadRecord(key);
    
    if (!record || now >= record.resetTime) {
      return {
        current: 0,
        remaining: this.config.max,
        resetTime: now + this.config.windowMs,
        limit: this.config.max,
        windowMs: this.config.windowMs
      };
    }

    return {
      current: record.count,
      remaining: Math.max(0, this.config.max - record.count),
      resetTime: record.resetTime,
      limit: this.config.max,
      windowMs: this.config.windowMs
    };
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = this.getStorageKey(identifier);
    await AsyncStorage.removeItem(key);
    this.limits.delete(identifier);
  }

  async getRateLimitHeaders(identifier: string): Promise<Record<string, string>> {
    const status = await this.getStatus(identifier);
    const resetTime = Math.ceil(status.resetTime / 1000);
    
    return {
      'X-RateLimit-Limit': status.limit.toString(),
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': resetTime.toString(),
      'X-RateLimit-Window': status.windowMs.toString()
    };
  }

  private getStorageKey(identifier: string): string {
    return `rate_limit_${identifier}`;
  }

  private async loadRecord(key: string): Promise<RateLimitRecord | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load rate limit record:', error);
    }
    return null;
  }

  private async saveRecord(key: string, record: RateLimitRecord): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      console.error('Failed to save rate limit record:', error);
    }
  }

  // Multi-tier rate limiting
  async checkTieredLimit(
    identifier: string, 
    tier: 'free' | 'pro' | 'enterprise'
  ): Promise<{ allowed: boolean; tier: string; remaining: number }> {
    const tiers = {
      free: { windowMs: 60000, max: 60 },     // 60/minute
      pro: { windowMs: 60000, max: 300 },     // 300/minute
      enterprise: { windowMs: 60000, max: 1000 } // 1000/minute
    };

    const config = tiers[tier];
    const key = `rate_limit_${identifier}_${tier}`;
    
    // Use the same logic but with tier-specific key
    const originalConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    const result = await this.checkLimit(key);
    
    // Restore original config
    this.config = originalConfig;
    
    return {
      allowed: result.allowed,
      tier,
      remaining: result.remaining
    };
  }

  // Burst protection
  async checkBurstLimit(
    identifier: string,
    burstWindowMs: number = 1000,
    burstMax: number = 10
  ): Promise<{ allowed: boolean; reason?: string }> {
    const key = `burst_limit_${identifier}`;
    const now = Date.now();
    
    let burstRecord = await this.loadRecord(key);
    
    if (!burstRecord) {
      burstRecord = {
        count: 0,
        resetTime: now + burstWindowMs,
        firstRequestTime: now
      };
    }

    if (now >= burstRecord.resetTime) {
      // Reset burst window
      burstRecord = {
        count: 0,
        resetTime: now + burstWindowMs,
        firstRequestTime: now
      };
    }

    if (burstRecord.count >= burstMax) {
      return {
        allowed: false,
        reason: `Too many requests in short period. Max ${burstMax} per ${burstWindowMs}ms`
      };
    }

    burstRecord.count++;
    await this.saveRecord(key, burstRecord);
    
    return { allowed: true };
  }
}