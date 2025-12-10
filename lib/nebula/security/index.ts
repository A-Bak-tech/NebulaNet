import { APIKeyManager } from './api-keys';
import { RateLimiter } from './rate-limiter';
import { EncryptionManager } from './encryption';
import { SecureStorage } from './secure-storage';
import { AuditLogger } from './audit-log';

export class SecurityManager {
  private static instance: SecurityManager;
  
  public apiKeys: APIKeyManager;
  public rateLimiter: RateLimiter;
  public encryption: EncryptionManager;
  public secureStorage: SecureStorage;
  public auditLogger: AuditLogger;

  private constructor() {
    this.apiKeys = new APIKeyManager();
    this.rateLimiter = new RateLimiter();
    this.encryption = new EncryptionManager();
    this.secureStorage = new SecureStorage();
    this.auditLogger = new AuditLogger();
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔐 Initializing security manager...');
    
    await Promise.all([
      this.apiKeys.initialize(),
      this.secureStorage.initializeSession(),
      this.auditLogger.initialize()
    ]);

    // Log initialization
    await this.auditLogger.log({
      eventType: AuditEventType.SESSION_CREATED,
      severity: AuditSeverity.INFO,
      action: 'Security manager initialized',
      details: { timestamp: new Date().toISOString() }
    });

    console.log('✅ Security manager initialized');
  }

  async secureRequest(
    apiKey: string,
    endpoint: string,
    userId?: string
  ): Promise<{
    allowed: boolean;
    user?: string;
    permissions?: string[];
    rateLimit?: {
      remaining: number;
      resetTime: number;
      limit: number;
    };
    error?: string;
  }> {
    // Validate API key
    const keyValidation = await this.apiKeys.validateKey(apiKey);
    if (!keyValidation.isValid) {
      await this.auditLogger.logAuthentication(
        userId || 'unknown',
        false,
        { endpoint, reason: 'Invalid API key' }
      );
      return { allowed: false, error: keyValidation.error };
    }

    // Check rate limits
    const rateLimit = await this.rateLimiter.checkLimit(keyValidation.keyId!);
    if (!rateLimit.allowed) {
      await this.auditLogger.log({
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        severity: AuditSeverity.WARNING,
        userId: keyValidation.userId,
        apiKeyId: keyValidation.keyId,
        action: `Rate limit exceeded for ${endpoint}`,
        details: {
          endpoint,
          remaining: rateLimit.remaining,
          retryAfter: rateLimit.retryAfter
        }
      });
      
      return {
        allowed: false,
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`
      };
    }

    // Check burst limits
    const burstLimit = await this.rateLimiter.checkBurstLimit(keyValidation.keyId!);
    if (!burstLimit.allowed) {
      await this.auditLogger.logSecurityAlert(
        `Burst limit exceeded for API key ${keyValidation.keyId}`,
        { endpoint, reason: burstLimit.reason }
      );
      
      return { allowed: false, error: burstLimit.reason };
    }

    // Log successful request
    await this.apiKeys.logUsage({
      keyId: keyValidation.keyId!,
      endpoint,
      duration: 0,
      success: true,
      userId: keyValidation.userId
    });

    await this.rateLimiter.increment(keyValidation.keyId!, true);

    return {
      allowed: true,
      user: keyValidation.userId,
      permissions: keyValidation.permissions,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
        limit: rateLimit.limit
      }
    };
  }

  async encryptSensitiveData(data: any, options?: {
    password?: string;
    ttl?: number;
    metadata?: Record<string, any>;
  }): Promise<{
    encrypted: string;
    keyId?: string;
    expiresAt?: Date;
  }> {
    try {
      const encrypted = await this.encryption.encrypt(
        JSON.stringify(data),
        options?.password
      );

      // Store encryption metadata
      const keyId = `enc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.secureStorage.setItem(
        keyId,
        {
          algorithm: encrypted.algorithm,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          timestamp: encrypted.timestamp
        },
        {
          encrypt: true,
          ttl: options?.ttl,
          metadata: options?.metadata
        }
      );

      return {
        encrypted: encrypted.encrypted,
        keyId,
        expiresAt: options?.ttl ? new Date(Date.now() + options.ttl) : undefined
      };

    } catch (error) {
      await this.auditLogger.log({
        eventType: AuditEventType.ENCRYPTION_FAILED,
        severity: AuditSeverity.ERROR,
        action: 'Failed to encrypt sensitive data',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  async decryptSensitiveData(
    encryptedData: string,
    keyId: string,
    password?: string
  ): Promise<any> {
    try {
      // Retrieve encryption metadata
      const metadata = await this.secureStorage.getItem<{
        algorithm: string;
        iv: string;
        authTag: string;
        timestamp: number;
      }>(keyId);

      if (!metadata) {
        throw new Error('Encryption metadata not found');
      }

      const decrypted = await this.encryption.decrypt(
        {
          encrypted: encryptedData,
          iv: metadata.iv,
          authTag: metadata.authTag,
          algorithm: metadata.algorithm,
          timestamp: metadata.timestamp
        },
        password
      );

      return JSON.parse(decrypted);

    } catch (error) {
      await this.auditLogger.log({
        eventType: AuditEventType.DECRYPTION_FAILED,
        severity: AuditSeverity.ERROR,
        action: 'Failed to decrypt sensitive data',
        details: {
          keyId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  }

  async createUserAPIKey(
    userId: string,
    keyName: string,
    permissions: string[] = ['read', 'generate']
  ): Promise<{ key: string; apiKey: any }> {
    const result = await this.apiKeys.createKey(userId, {
      name: keyName,
      permissions,
      rateLimit: 60,
      expiresInDays: 365
    });

    await this.auditLogger.log({
      eventType: AuditEventType.API_KEY_CREATED,
      severity: AuditSeverity.INFO,
      userId,
      apiKeyId: result.apiKey.id,
      action: `API key "${keyName}" created`,
      details: {
        permissions,
        rateLimit: result.apiKey.rateLimit,
        expiresAt: result.apiKey.expiresAt
      }
    });

    return result;
  }

  async getSecurityReport(): Promise<{
    apiKeys: {
      total: number;
      active: number;
      expired: number;
    };
    rateLimiting: {
      totalChecks: number;
      blockedRequests: number;
      averageResponseTime: number;
    };
    encryption: {
      totalEncryptions: number;
      totalDecryptions: number;
      failedOperations: number;
    };
    auditLogs: {
      totalEntries: number;
      securityAlerts: number;
      authenticationFailures: number;
    };
    recommendations: string[];
  }> {
    const apiKeys = await this.apiKeys.getUserKeys('all');
    const auditStats = await this.auditLogger.getStatistics({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    });

    const activeKeys = apiKeys.filter(key => key.isActive);
    const expiredKeys = apiKeys.filter(key => 
      key.expiresAt && new Date() > key.expiresAt
    );

    const recommendations: string[] = [];
    
    if (expiredKeys.length > 0) {
      recommendations.push(`Rotate ${expiredKeys.length} expired API keys`);
    }
    
    if (auditStats.eventsBySeverity[AuditSeverity.CRITICAL] > 0) {
      recommendations.push('Investigate critical security alerts');
    }
    
    if (auditStats.eventsByType[AuditEventType.AUTHENTICATION_FAILED] > 10) {
      recommendations.push('Review authentication failure patterns');
    }

    return {
      apiKeys: {
        total: apiKeys.length,
        active: activeKeys.length,
        expired: expiredKeys.length
      },
      rateLimiting: {
        totalChecks: 0, // Would track in production
        blockedRequests: auditStats.eventsByType[AuditEventType.RATE_LIMIT_EXCEEDED] || 0,
        averageResponseTime: 0
      },
      encryption: {
        totalEncryptions: 0,
        totalDecryptions: 0,
        failedOperations: auditStats.eventsByType[AuditEventType.ENCRYPTION_FAILED] || 0
      },
      auditLogs: {
        totalEntries: auditStats.totalEvents,
        securityAlerts: auditStats.eventsByType[AuditEventType.SECURITY_ALERT] || 0,
        authenticationFailures: auditStats.eventsByType[AuditEventType.AUTHENTICATION_FAILED] || 0
      },
      recommendations
    };
  }

  async cleanupExpiredData(): Promise<void> {
    // Cleanup expired API keys
    const allKeys = await this.apiKeys.getUserKeys('all');
    const expiredKeys = allKeys.filter(key => 
      key.expiresAt && new Date() > key.expiresAt
    );
    
    for (const key of expiredKeys) {
      await this.apiKeys.revokeKey(key.id);
    }

    // Cleanup audit logs
    await this.auditLogger.cleanupOldLogs();

    await this.auditLogger.log({
      eventType: AuditEventType.CONFIG_CHANGED,
      severity: AuditSeverity.INFO,
      action: 'Security data cleanup completed',
      details: {
        expiredKeysRevoked: expiredKeys.length,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export * from './api-keys';
export * from './rate-limiter';
export * from './encryption';
export * from './secure-storage';
export * from './audit-log';