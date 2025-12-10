import AsyncStorage from '@react-native-async-storage/async-storage';
import crypto from 'crypto';

export enum AuditEventType {
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  API_KEY_ROTATED = 'api_key_rotated',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  ENCRYPTION_FAILED = 'encryption_failed',
  DECRYPTION_FAILED = 'decryption_failed',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILED = 'authentication_failed',
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  DATA_ACCESS = 'data_access',
  DATA_MODIFIED = 'data_modified',
  CONFIG_CHANGED = 'config_changed',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_ERROR = 'system_error'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  apiKeyId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource?: string;
  details: Record<string, any>;
  metadata: {
    appVersion: string;
    platform: string;
    deviceId?: string;
    correlationId?: string;
  };
  hash: string; // For integrity verification
}

export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  severity?: AuditSeverity[];
  userId?: string;
  apiKeyId?: string;
  resource?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private readonly MAX_LOGS = 10000;
  private readonly RETENTION_DAYS = 90;
  private readonly APP_VERSION = '1.0.0';
  private logs: AuditLogEntry[] = [];

  async initialize(): Promise<void> {
    await this.loadLogs();
    await this.cleanupOldLogs();
  }

  async log(event: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'metadata'> & {
    metadata?: Partial<AuditLogEntry['metadata']>;
  }): Promise<string> {
    const timestamp = new Date();
    const id = `audit_${timestamp.getTime()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const metadata: AuditLogEntry['metadata'] = {
      appVersion: this.APP_VERSION,
      platform: this.getPlatform(),
      deviceId: await this.getDeviceId(),
      correlationId: crypto.randomBytes(16).toString('hex'),
      ...event.metadata
    };

    const entry: AuditLogEntry = {
      ...event,
      id,
      timestamp,
      metadata,
      hash: this.calculateHash({ ...event, id, timestamp, metadata })
    };

    this.logs.unshift(entry); // Add to beginning for chronological order
    
    // Keep within limits
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    await this.saveLogs();
    
    // Also log to console in development
    if (__DEV__) {
      console.log(`[AUDIT] ${entry.eventType}: ${entry.action}`, entry.details);
    }

    return id;
  }

  async query(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    let filtered = [...this.logs];

    if (query.startDate) {
      filtered = filtered.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(log => log.timestamp <= query.endDate!);
    }

    if (query.eventTypes?.length) {
      filtered = filtered.filter(log => query.eventTypes!.includes(log.eventType));
    }

    if (query.severity?.length) {
      filtered = filtered.filter(log => query.severity!.includes(log.severity));
    }

    if (query.userId) {
      filtered = filtered.filter(log => log.userId === query.userId);
    }

    if (query.apiKeyId) {
      filtered = filtered.filter(log => log.apiKeyId === query.apiKeyId);
    }

    if (query.resource) {
      filtered = filtered.filter(log => log.resource?.includes(query.resource!));
    }

    const limit = query.limit || 100;
    const offset = query.offset || 0;

    return filtered.slice(offset, offset + limit);
  }

  async getStatistics(timeRange: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    eventsByUser: Record<string, number>;
    eventsByHour: Record<number, number>;
    topResources: Array<{ resource: string; count: number }>;
  }> {
    const logsInRange = this.logs.filter(log => 
      log.timestamp >= timeRange.start && 
      log.timestamp <= timeRange.end
    );

    const eventsByType: Record<AuditEventType, number> = {} as any;
    const eventsBySeverity: Record<AuditSeverity, number> = {} as any;
    const eventsByUser: Record<string, number> = {};
    const eventsByHour: Record<number, number> = {};
    const resourceCounts: Record<string, number> = {};

    logsInRange.forEach(log => {
      // Count by type
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
      
      // Count by user
      if (log.userId) {
        eventsByUser[log.userId] = (eventsByUser[log.userId] || 0) + 1;
      }
      
      // Count by hour
      const hour = log.timestamp.getHours();
      eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
      
      // Count by resource
      if (log.resource) {
        resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      }
    });

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: logsInRange.length,
      eventsByType,
      eventsBySeverity,
      eventsByUser,
      eventsByHour,
      topResources
    };
  }

  async exportLogs(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      
      case 'csv':
        return this.convertToCSV(this.logs);
      
      case 'pdf':
        // In production, use a PDF generation library
        return JSON.stringify(exportData);
      
      default:
        return JSON.stringify(exportData);
    }
  }

  async verifyIntegrity(): Promise<{
    valid: boolean;
    invalidEntries: AuditLogEntry[];
    tamperedCount: number;
  }> {
    const invalidEntries: AuditLogEntry[] = [];
    
    for (const entry of this.logs) {
      const calculatedHash = this.calculateHash(entry);
      if (calculatedHash !== entry.hash) {
        invalidEntries.push(entry);
      }
    }

    return {
      valid: invalidEntries.length === 0,
      invalidEntries,
      tamperedCount: invalidEntries.length
    };
  }

  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    await this.saveLogs();
  }

  // Helper logging methods
  async logSecurityAlert(
    action: string,
    details: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.WARNING
  ): Promise<string> {
    return this.log({
      eventType: AuditEventType.SECURITY_ALERT,
      severity,
      action,
      details,
      metadata: { alert: true }
    });
  }

  async logAuthentication(
    userId: string,
    success: boolean,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      eventType: success ? AuditEventType.AUTHENTICATION_SUCCESS : AuditEventType.AUTHENTICATION_FAILED,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      userId,
      action: `Authentication ${success ? 'successful' : 'failed'}`,
      details
    });
  }

  async logDataAccess(
    userId: string,
    resource: string,
    action: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.log({
      eventType: AuditEventType.DATA_ACCESS,
      severity: AuditSeverity.INFO,
      userId,
      resource,
      action: `Data access: ${action}`,
      details
    });
  }

  private async loadLogs(): Promise<void> {
    try {
      const logsData = await AsyncStorage.getItem('nebula_audit_logs');
      if (logsData) {
        const parsed = JSON.parse(logsData);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem('nebula_audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }

  private calculateHash(data: Omit<AuditLogEntry, 'hash'>): string {
    const hashData = {
      ...data,
      timestamp: data.timestamp.toISOString()
    };
    
    const hashString = JSON.stringify(hashData);
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  private getPlatform(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }
    return process.platform || 'unknown';
  }

  private async getDeviceId(): Promise<string | undefined> {
    try {
      // In React Native, you might use DeviceInfo or similar
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        const newId = crypto.randomBytes(16).toString('hex');
        await AsyncStorage.setItem('device_id', newId);
        return newId;
      }
      return deviceId;
    } catch {
      return undefined;
    }
  }

  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) return '';
    
    const headers = [
      'Timestamp',
      'Event Type',
      'Severity',
      'User ID',
      'Action',
      'Resource',
      'Details'
    ];
    
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.eventType,
      log.severity,
      log.userId || '',
      log.action,
      log.resource || '',
      JSON.stringify(log.details)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
}