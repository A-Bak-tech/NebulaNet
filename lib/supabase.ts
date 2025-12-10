import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import Constants from 'expo-constants';

// Get Supabase URL and key from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env
EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase configuration');
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                'X-Client-Info': 'nebula-net@1.0.0',
        },
    },
});

// Helper functions for common operations
export const supabaseHelpers = {
    // Check if user is authenticated
    isAuthenticated: () => {
        const session = supabase.auth.getSession();
        return !!session;
    },

    // Get current user
    getCurrentUser: async () => {
        const { data: { user }, error} = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    // Subscribe to auth state changes
    onAuthStateChange: (callback: any) => {
        return supabase.auth.onAuthStateChange(callback);
    },

    // Upload file to storage
    uploadFile: async (bucket: string, path: string, file: File | Blob) => {
        const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });

        if (error) throw error;
        return data;
    },

    // Get public URL for file
    getPublicUrl: (bucket: string, path: string) => {
        const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

        return data.publicUrl;
    },
};

export default supabase;