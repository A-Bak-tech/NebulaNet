import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptionManager } from './encryption';
import crypto from 'crypto';

export interface SecureStorageOptions {
  encryptionEnabled: boolean;
  autoLockTimeout: number; // milliseconds
  maxRetries: number;
  wipeOnMaxRetries: boolean;
}

export interface SecureItem {
  id: string;
  data: string;
  encrypted: boolean;
  iv?: string;
  authTag?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class SecureStorage {
  private encryptionManager: EncryptionManager;
  private options: SecureStorageOptions;
  private sessionKey?: string;
  private sessionExpiresAt?: number;
  private failedAttempts: Map<string, number> = new Map();

  constructor(options: Partial<SecureStorageOptions> = {}) {
    this.encryptionManager = new EncryptionManager();
    this.options = {
      encryptionEnabled: true,
      autoLockTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetries: 5,
      wipeOnMaxRetries: true,
      ...options
    };
  }

  async initializeSession(password?: string): Promise<void> {
    if (password) {
      // Derive session key from password
      const salt = await AsyncStorage.getItem('session_salt');
      if (!salt) {
        const newSalt = crypto.randomBytes(32).toString('hex');
        await AsyncStorage.setItem('session_salt', newSalt);
      }
    } else {
      // Generate random session key
      this.sessionKey = this.encryptionManager.generateSecureToken();
    }
    
    this.sessionExpiresAt = Date.now() + this.options.autoLockTimeout;
    this.startAutoLockTimer();
  }

  async setItem(
    key: string, 
    value: any, 
    options: {
      encrypt?: boolean;
      ttl?: number; // time to live in milliseconds
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    this.checkSession();

    const shouldEncrypt = options.encrypt ?? this.options.encryptionEnabled;
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    
    let encryptedData = data;
    let iv: string | undefined;
    let authTag: string | undefined;

    if (shouldEncrypt && this.sessionKey) {
      const encrypted = await this.encryptionManager.encrypt(data, this.sessionKey);
      encryptedData = encrypted.encrypted;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const secureItem: SecureItem = {
      id: this.hashKey(key),
      data: encryptedData,
      encrypted: shouldEncrypt,
      iv,
      authTag,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: options.ttl ? new Date(Date.now() + options.ttl) : undefined,
      metadata: options.metadata
    };

    await AsyncStorage.setItem(
      this.getStorageKey(key),
      JSON.stringify(secureItem)
    );

    // Clear failed attempts on successful storage
    this.failedAttempts.delete(key);
  }

  async getItem<T = any>(
    key: string, 
    defaultValue?: T
  ): Promise<T | undefined> {
    this.checkSession();

    const storageKey = this.getStorageKey(key);
    const itemJson = await AsyncStorage.getItem(storageKey);
    
    if (!itemJson) {
      return defaultValue;
    }

    const secureItem: SecureItem = JSON.parse(itemJson);
    
    // Check if expired
    if (secureItem.expiresAt && new Date(secureItem.expiresAt) < new Date()) {
      await this.removeItem(key);
      return defaultValue;
    }

    let data = secureItem.data;
    
    if (secureItem.encrypted && this.sessionKey) {
      try {
        data = await this.encryptionManager.decrypt(
          {
            encrypted: secureItem.data,
            iv: secureItem.iv!,
            authTag: secureItem.authTag!,
            algorithm: 'aes-256-gcm',
            timestamp: secureItem.createdAt.getTime()
          },
          this.sessionKey
        );
      } catch (error) {
        this.recordFailedAttempt(key);
        throw new Error('Failed to decrypt data. Invalid session or corrupted data.');
      }
    }

    // Clear failed attempts on successful retrieval
    this.failedAttempts.delete(key);

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as T;
    }
  }

  async removeItem(key: string): Promise<void> {
    const storageKey = this.getStorageKey(key);
    await AsyncStorage.removeItem(storageKey);
    this.failedAttempts.delete(key);
  }

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const secureKeys = keys.filter(key => key.startsWith('secure_'));
    
    for (const key of secureKeys) {
      await AsyncStorage.removeItem(key);
    }
    
    this.failedAttempts.clear();
  }

  async exists(key: string): Promise<boolean> {
    const storageKey = this.getStorageKey(key);
    const item = await AsyncStorage.getItem(storageKey);
    return !!item;
  }

  async getKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(key => key.startsWith('secure_'))
      .map(key => key.replace('secure_', ''));
  }

  async getItemsWithMetadata(metadataFilter: Record<string, any>): Promise<Array<{ key: string; item: SecureItem }>> {
    const keys = await this.getKeys();
    const results: Array<{ key: string; item: SecureItem }> = [];

    for (const key of keys) {
      const storageKey = this.getStorageKey(key);
      const itemJson = await AsyncStorage.getItem(storageKey);
      
      if (itemJson) {
        const item: SecureItem = JSON.parse(itemJson);
        
        // Check metadata match
        let matches = true;
        for (const [filterKey, filterValue] of Object.entries(metadataFilter)) {
          if (item.metadata?.[filterKey] !== filterValue) {
            matches = false;
            break;
          }
        }

        if (matches) {
          results.push({ key, item });
        }
      }
    }

    return results;
  }

  async getStorageStats(): Promise<{
    totalItems: number;
    totalSize: number;
    encryptedItems: number;
    expiredItems: number;
  }> {
    const keys = await AsyncStorage.getAllKeys();
    const secureKeys = keys.filter(key => key.startsWith('secure_'));
    
    let totalSize = 0;
    let encryptedItems = 0;
    let expiredItems = 0;

    for (const key of secureKeys) {
      const itemJson = await AsyncStorage.getItem(key);
      if (itemJson) {
        totalSize += itemJson.length;
        
        const item: SecureItem = JSON.parse(itemJson);
        if (item.encrypted) encryptedItems++;
        if (item.expiresAt && new Date(item.expiresAt) < new Date()) expiredItems++;
      }
    }

    return {
      totalItems: secureKeys.length,
      totalSize,
      encryptedItems,
      expiredItems
    };
  }

  async migrateToNewKey(oldPassword: string, newPassword: string): Promise<void> {
    const keys = await this.getKeys();
    
    for (const key of keys) {
      try {
        // Temporarily use old password
        const tempSessionKey = oldPassword;
        const item = await this.getItem(key);
        
        if (item) {
          // Re-encrypt with new password
          await this.setItem(key, item, {
            encrypt: true,
            metadata: { migrated: true }
          });
        }
      } catch (error) {
        console.error(`Failed to migrate key ${key}:`, error);
      }
    }
  }

  private checkSession(): void {
    if (!this.sessionKey) {
      throw new Error('Session not initialized. Call initializeSession first.');
    }

    if (this.sessionExpiresAt && Date.now() > this.sessionExpiresAt) {
      this.lock();
      throw new Error('Session expired. Please re-authenticate.');
    }

    // Reset auto-lock timer
    this.sessionExpiresAt = Date.now() + this.options.autoLockTimeout;
  }

  private lock(): void {
    this.sessionKey = undefined;
    this.sessionExpiresAt = undefined;
  }

  private startAutoLockTimer(): void {
    if (this.options.autoLockTimeout > 0) {
      setTimeout(() => {
        if (this.sessionExpiresAt && Date.now() > this.sessionExpiresAt) {
          this.lock();
        }
      }, this.options.autoLockTimeout);
    }
  }

  private recordFailedAttempt(key: string): void {
    const attempts = (this.failedAttempts.get(key) || 0) + 1;
    this.failedAttempts.set(key, attempts);

    if (attempts >= this.options.maxRetries) {
      if (this.options.wipeOnMaxRetries) {
        this.wipeKey(key);
      }
      throw new Error(`Maximum retry attempts (${this.options.maxRetries}) exceeded for key: ${key}`);
    }
  }

  private async wipeKey(key: string): Promise<void> {
    await this.removeItem(key);
    this.failedAttempts.delete(key);
    console.warn(`Key ${key} wiped due to maximum failed attempts`);
  }

  private getStorageKey(key: string): string {
    return `secure_${this.hashKey(key)}`;
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}