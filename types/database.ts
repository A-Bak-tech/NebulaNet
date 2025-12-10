export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Users table
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'user' | 'moderator' | 'admin'
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'moderator' | 'admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'moderator' | 'admin'
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Posts table
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          nebula_enhanced_content: string | null
          media_urls: string[] | null
          tags: string[] | null
          is_enhanced: boolean
          is_nsfw: boolean
          visibility: 'public' | 'private' | 'friends'
          likes_count: number
          comments_count: number
          echoes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          nebula_enhanced_content?: string | null
          media_urls?: string[] | null
          tags?: string[] | null
          is_enhanced?: boolean
          is_nsfw?: boolean
          visibility?: 'public' | 'private' | 'friends'
          likes_count?: number
          comments_count?: number
          echoes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          nebula_enhanced_content?: string | null
          media_urls?: string[] | null
          tags?: string[] | null
          is_enhanced?: boolean
          is_nsfw?: boolean
          visibility?: 'public' | 'private' | 'friends'
          likes_count?: number
          comments_count?: number
          echoes_count?: number
          created_at?: string
          updated_at?: string
        }
      }

      // Comments table
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          parent_id: string | null
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          parent_id?: string | null
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          parent_id?: string | null
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }

      // Waitlist table
      waitlist: {
        Row: {
          id: string
          email: string
          name: string | null
          reason: string | null
          invited_at: string | null
          is_invited: boolean
          referral_code: string
          referred_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          reason?: string | null
          invited_at?: string | null
          is_invited?: boolean
          referral_code?: string
          referred_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          reason?: string | null
          invited_at?: string | null
          is_invited?: boolean
          referral_code?: string
          referred_by?: string | null
          created_at?: string
        }
      }

      // Nebula AI models table
      nebula_models: {
        Row: {
          id: string
          name: string
          version: string
          model_type: 'text_generation' | 'sentiment' | 'moderation' | 'enhancement'
          status: 'training' | 'ready' | 'failed' | 'archived'
          accuracy: number | null
          parameters: Json
          file_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          version: string
          model_type: 'text_generation' | 'sentiment' | 'moderation' | 'enhancement'
          status?: 'training' | 'ready' | 'failed' | 'archived'
          accuracy?: number | null
          parameters?: Json
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          version?: string
          model_type?: 'text_generation' | 'sentiment' | 'moderation' | 'enhancement'
          status?: 'training' | 'ready' | 'failed' | 'archived'
          accuracy?: number | null
          parameters?: Json
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      // Function to increment like count
      increment_likes: {
        Args: {
          post_id: string
          increment: number
        }
        Returns: void
      }
      
      // Function to get trending posts
      get_trending_posts: {
        Args: {
          hours: number
          limit: number
        }
        Returns: {
          id: string
          user_id: string
          content: string
          likes_count: number
          comments_count: number
          created_at: string
          username: string
          avatar_url: string
        }[]
      }
    }

    Enums: {
      user_role: 'user' | 'moderator' | 'admin'
      post_visibility: 'public' | 'private' | 'friends'
      model_status: 'training' | 'ready' | 'failed' | 'archived'
      model_type: 'text_generation' | 'sentiment' | 'moderation' | 'enhancement'
    }
  }
}