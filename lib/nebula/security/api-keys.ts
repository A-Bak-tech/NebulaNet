import crypto from 'crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit: number; // requests per minute
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface APIKeyUsage {
  keyId: string;
  endpoint: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();
  private usageLog: APIKeyUsage[] = [];
  private readonly ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || 'default-secret-key-change-in-production';

  async initialize(): Promise<void> {
    await this.loadKeysFromStorage();
  }

  async createKey(userId: string, options: {
    name: string;
    permissions?: string[];
    rateLimit?: number;
    expiresInDays?: number;
  }): Promise<{ key: string; apiKey: APIKey }> {
    // Generate secure random key
    const key = this.generateSecureKey();
    const keyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    const apiKey: APIKey = {
      id: keyId,
      key: this.encryptKey(key),
      name: options.name,
      userId,
      permissions: options.permissions || ['read', 'generate'],
      rateLimit: options.rateLimit || 60,
      expiresAt: options.expiresInDays 
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      createdAt: new Date(),
      isActive: true
    };

    this.keys.set(keyId, apiKey);
    await this.saveKeysToStorage();
    
    return { key, apiKey };
  }

  async validateKey(apiKey: string): Promise<{
    isValid: boolean;
    keyId?: string;
    userId?: string;
    permissions?: string[];
    rateLimit?: number;
    error?: string;
  }> {
    // Find the key
    const encryptedKey = this.encryptKey(apiKey);
    let foundKey: APIKey | undefined;
    
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.key === encryptedKey) {
        foundKey = keyData;
        break;
      }
    }

    if (!foundKey) {
      return { isValid: false, error: 'Invalid API key' };
    }

    if (!foundKey.isActive) {
      return { isValid: false, error: 'API key is inactive' };
    }

    if (foundKey.expiresAt && new Date() > foundKey.expiresAt) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Update last used
    foundKey.lastUsedAt = new Date();
    await this.saveKeysToStorage();

    return {
      isValid: true,
      keyId: foundKey.id,
      userId: foundKey.userId,
      permissions: foundKey.permissions,
      rateLimit: foundKey.rateLimit
    };
  }

  async revokeKey(keyId: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) return false;
    
    key.isActive = false;
    await this.saveKeysToStorage();
    return true;
  }

  async rotateKey(keyId: string): Promise<{ newKey: string; apiKey: APIKey }> {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error('Key not found');
    }

    // Generate new key
    const newKey = this.generateSecureKey();
    const newApiKey: APIKey = {
      ...oldKey,
      key: this.encryptKey(newKey),
      createdAt: new Date(),
      lastUsedAt: undefined
    };

    // Deactivate old key
    oldKey.isActive = false;
    
    // Add new key
    const newKeyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    newApiKey.id = newKeyId;
    
    this.keys.set(newKeyId, newApiKey);
    await this.saveKeysToStorage();

    return { newKey, apiKey: newApiKey };
  }

  async logUsage(usage: Omit<APIKeyUsage, 'timestamp'>): Promise<void> {
    const logEntry: APIKeyUsage = {
      ...usage,
      timestamp: new Date()
    };

    this.usageLog.push(logEntry);
    
    // Keep only last 1000 entries
    if (this.usageLog.length > 1000) {
      this.usageLog = this.usageLog.slice(-1000);
    }

    await this.saveUsageLog();
  }

  async getKeyUsage(keyId: string, timeRange?: { start: Date; end: Date }): Promise<APIKeyUsage[]> {
    let usage = this.usageLog.filter(log => log.keyId === keyId);
    
    if (timeRange) {
      usage = usage.filter(log => 
        log.timestamp >= timeRange.start && 
        log.timestamp <= timeRange.end
      );
    }

    return usage;
  }

  async getUserKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.keys.values())
      .filter(key => key.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateSecureKey(): string {
    return `neb_${crypto.randomBytes(32).toString('hex')}`;
  }

  private encryptKey(key: string): string {
    const cipher = crypto.createCipher('aes-256-gcm', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptKey(encrypted: string): string {
    const decipher = crypto.createDecipher('aes-256-gcm', this.ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async saveKeysToStorage(): Promise<void> {
    const keysArray = Array.from(this.keys.values());
    await AsyncStorage.setItem('nebula_api_keys', JSON.stringify(keysArray));
  }

  private async loadKeysFromStorage(): Promise<void> {
    try {
      const keysData = await AsyncStorage.getItem('nebula_api_keys');
      if (keysData) {
        const keys: APIKey[] = JSON.parse(keysData);
        keys.forEach(key => {
          key.createdAt = new Date(key.createdAt);
          if (key.expiresAt) key.expiresAt = new Date(key.expiresAt);
          if (key.lastUsedAt) key.lastUsedAt = new Date(key.lastUsedAt);
          this.keys.set(key.id, key);
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  private async saveUsageLog(): Promise<void> {
    await AsyncStorage.setItem('nebula_api_key_usage', JSON.stringify(this.usageLog));
  }

  private async loadUsageLog(): Promise<void> {
    try {
      const usageData = await AsyncStorage.getItem('nebula_api_key_usage');
      if (usageData) {
        const usage: APIKeyUsage[] = JSON.parse(usageData);
        usage.forEach(entry => {
          entry.timestamp = new Date(entry.timestamp);
        });
        this.usageLog = usage;
      }
    } catch (error) {
      console.error('Failed to load usage log:', error);
    }
  }
}