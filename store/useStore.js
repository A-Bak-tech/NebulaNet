// store/useStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      authLoading: true,
      
      // Feed state
      feed: [],
      feedPage: 0,
      feedHasMore: true,
      feedLoading: false,
      feedRefreshing: false,
      
      // Notifications
      notifications: [],
      unreadCount: 0,
      notificationsLoading: false,
      
      // Messages
      conversations: [],
      activeConversation: null,
      messages: [],
      
      // Communities
      communities: [],
      joinedCommunities: [],
      
      // UI state
      theme: 'light',
      bottomTabVisible: true,
      
      // Actions
      setAuthState: (user, session, profile) => set({
        user,
        session,
        profile,
        isAuthenticated: !!user,
        authLoading: false,
      }),
      
      setAuthLoading: (loading) => set({ authLoading: loading }),
      
      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          profile: null,
          isAuthenticated: false,
          feed: [],
          notifications: [],
          conversations: [],
          messages: [],
        });
      },
      
      updateProfile: (updates) => set((state) => ({
        profile: { ...state.profile, ...updates },
      })),
      
      // Feed actions
      setFeed: (feed) => set({ feed }),
      addToFeed: (posts) => set((state) => ({
        feed: [...posts, ...state.feed],
      })),
      appendToFeed: (posts) => set((state) => ({
        feed: [...state.feed, ...posts],
      })),
      updatePostInFeed: (postId, updates) => set((state) => ({
        feed: state.feed.map(post =>
          post.id === postId ? { ...post, ...updates } : post
        ),
      })),
      removeFromFeed: (postId) => set((state) => ({
        feed: state.feed.filter(post => post.id !== postId),
      })),
      
      setFeedLoading: (loading) => set({ feedLoading: loading }),
      setFeedRefreshing: (refreshing) => set({ feedRefreshing: refreshing }),
      setFeedPage: (page) => set({ feedPage: page }),
      setFeedHasMore: (hasMore) => set({ feedHasMore: hasMore }),
      
      // Notification actions
      setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.read_at).length,
      }),
      addNotification: (notification) => set((state) => {
        const newNotifications = [notification, ...state.notifications];
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter(n => !n.read_at).length,
        };
      }),
      markNotificationAsRead: (notificationId) => set((state) => {
        const updated = state.notifications.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.read_at).length,
        };
      }),
      markAllNotificationsAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      })),
      
      // Message actions
      setConversations: (conversations) => set({ conversations }),
      setActiveConversation: (conversation) => set({ activeConversation: conversation }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),
      
      // Community actions
      setCommunities: (communities) => set({ communities }),
      setJoinedCommunities: (communities) => set({ joinedCommunities }),
      joinCommunity: (community) => set((state) => ({
        joinedCommunities: [...state.joinedCommunities, community],
      })),
      leaveCommunity: (communityId) => set((state) => ({
        joinedCommunities: state.joinedCommunities.filter(c => c.id !== communityId),
      })),
      
      // UI actions
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),
      setBottomTabVisible: (visible) => set({ bottomTabVisible: visible }),
      
      // Selectors (computed values)
      getFeedCount: () => get().feed.length,
      getUnreadNotifications: () => get().notifications.filter(n => !n.read_at),
      getActiveConversationMessages: () => {
        const { activeConversation, messages } = get();
        if (!activeConversation) return [];
        return messages.filter(m =>
          (m.sender_id === activeConversation.id || m.receiver_id === activeConversation.id)
        );
      },
    }),
    {
      name: 'nebulanet-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        theme: state.theme,
        joinedCommunities: state.joinedCommunities,
      }),
    }
  )
);

export default useStore;