import * as SecureStore from 'expo-secure-store';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const item = await this.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error parsing JSON from storage:', error);
      return null;
    }
  },

  async setJSON(key: string, value: any): Promise<void> {
    try {
      await this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error stringifying JSON for storage:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      // You might want to be more specific about which keys to clear
      const keys = ['user_session', 'app_settings', 'auth_tokens'];
      for (const key of keys) {
        await this.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};