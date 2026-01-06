// App.js - Updated with Phase 1 & 2 Infrastructure
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuProvider } from 'react-native-popup-menu';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import services and hooks
import { supabase } from './services/supabase';
import useStore from './store/useStore';
import logger from './services/logger';
import { COLORS } from './config/constants';

// Import all your screens with correct paths
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import CreatePasswordScreen from './screens/auth/CreatePasswordScreen';
import SelectInterestsScreen from './screens/auth/SelectInterestsScreen';
import CommunityOnboardingScreen from './screens/auth/CommunityOnboardingScreen';
import NotificationsScreen from './screens/notification/NotificationsScreen';
import CommentsScreen from './screens/post/CommentsScreen';
import InviteScreen from './screens/invite/InviteScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreatePostScreen from './screens/post/CreatePostScreen';
import ChatDetailScreen from './screens/chat/ChatDetailScreen';
import PostDetailScreen from './screens/post/PostDetailScreen';

// Import components
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Deep linking configuration
const linking = {
  prefixes: [
    'nebulanet://',
    'https://nebulanet.space',
    'https://*.nebulanet.space',
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Explore: 'explore',
          Chat: 'chat',
          Profile: 'profile',
        },
      },
      Login: 'login',
      Signup: 'signup',
      PostDetail: 'post/:id',
      Comments: 'post/:id/comments',
      Profile: 'user/:id',
      Invite: 'invite/:code',
      Settings: 'settings',
      Notifications: 'notifications',
    },
  },
};

// Main Tab Navigator (shown when user is logged in)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const {
    user,
    session,
    isAuthenticated,
    authLoading,
    setAuthState,
    setAuthLoading,
    logout,
  } = useStore();

  // Handle deep links
  const handleDeepLink = async (url) => {
    try {
      const { path, queryParams } = Linking.parse(url);
      logger.logNavigation('DeepLink', path, queryParams);

      // Store deep link for later use
      if (url) {
        await AsyncStorage.setItem('pending_deep_link', url);
      }

      // Handle invite codes
      if (path === 'invite' && queryParams.code) {
        await AsyncStorage.setItem('invite_code', queryParams.code);
        logger.info('Invite code stored:', queryParams.code);
      }

      // Handle post links
      if (path === 'post' && queryParams.id) {
        // Store post ID for later navigation
        await AsyncStorage.setItem('pending_post_id', queryParams.id);
      }
    } catch (error) {
      logger.error('Deep link handling error:', error);
    }
  };

  // Handle pending deep links after auth
  const handlePendingDeepLinks = async () => {
    try {
      const pendingLink = await AsyncStorage.getItem('pending_deep_link');
      if (pendingLink && isAuthenticated) {
        const { path, queryParams } = Linking.parse(pendingLink);
        
        if (path === 'post' && queryParams.id) {
          // Navigate to post detail
          // You would use navigation here, but we need to pass navigation
          console.log('Should navigate to post:', queryParams.id);
        }
        
        await AsyncStorage.removeItem('pending_deep_link');
      }
    } catch (error) {
      logger.error('Error handling pending deep links:', error);
    }
  };

  // Initialize auth and deep linking
  useEffect(() => {
    // Setup deep linking listener
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setAuthLoading(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Session error:', error);
          setAuthState(null, null, null);
          return;
        }

        if (session?.user) {
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            logger.error('Profile fetch error:', profileError);
            // Create profile if doesn't exist
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
                full_name: session.user.user_metadata?.full_name || '',
              })
              .select()
              .single();

            setAuthState(session.user, session, newProfile || null);
          } else {
            setAuthState(session.user, session, profile || null);
          }
          
          logger.logAuthEvent('session_restored', session.user);
          
          // Handle any pending deep links
          handlePendingDeepLinks();
        } else {
          setAuthState(null, null, null);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        setAuthState(null, null, null);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.logAuthEvent(event, session?.user);

        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch or create user profile on sign in
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            // Create profile if doesn't exist
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`,
                full_name: session.user.user_metadata?.full_name || '',
              })
              .select()
              .single();

            setAuthState(session.user, session, newProfile || null);
          } else {
            setAuthState(session.user, session, profile || null);
          }
          
          // Handle any pending deep links
          handlePendingDeepLinks();
        } else if (event === 'SIGNED_OUT') {
          setAuthState(null, null, null);
          logout();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update session
          setAuthState(session.user, session, user);
        } else if (event === 'USER_UPDATED') {
          // Update user in store
          setAuthState(session.user, session, user);
        }
      }
    );

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  // Show loading screen while checking auth
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <MenuProvider>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor={COLORS.background}
            animated
          />
          <NavigationContainer 
            linking={linking}
            fallback={<LoadingScreen />}
            theme={{
              dark: false,
              colors: {
                background: COLORS.background,
                border: COLORS.border,
                card: COLORS.card,
                primary: COLORS.primary,
                text: COLORS.text.primary,
                notification: COLORS.primary,
              },
            }}
            onStateChange={(state) => {
              // Track navigation state changes
              logger.logNavigation('StateChange', state?.routes?.[state.index]?.name);
            }}
          >
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                contentStyle: {
                  backgroundColor: COLORS.background,
                },
                headerStyle: {
                  backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.text.primary,
                headerShadowVisible: true,
              }}
              initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
            >
              {isAuthenticated ? (
                // Authenticated user flow
                <>
                  <Stack.Screen 
                    name="MainTabs" 
                    component={MainTabNavigator}
                    options={{
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen 
                    name="CreatePost" 
                    component={CreatePostScreen}
                    options={{
                      presentation: 'modal',
                      gestureEnabled: false,
                      headerShown: true,
                      title: 'Create Post',
                      headerBackTitle: 'Cancel',
                    }}
                  />
                  <Stack.Screen 
                    name="Comments" 
                    component={CommentsScreen}
                    options={{
                      headerShown: true,
                      title: 'Comments',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="Notifications" 
                    component={NotificationsScreen}
                    options={{
                      headerShown: true,
                      title: 'Notifications',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="Invite" 
                    component={InviteScreen}
                    options={{
                      headerShown: true,
                      title: 'Invite Friends',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="Settings" 
                    component={SettingsScreen}
                    options={{
                      headerShown: true,
                      title: 'Settings',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="ChatDetail" 
                    component={ChatDetailScreen}
                    options={{
                      headerShown: true,
                      title: 'Chat',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="PostDetail" 
                    component={PostDetailScreen}
                    options={{
                      headerShown: true,
                      title: 'Post',
                      headerBackTitle: 'Back',
                    }}
                  />
                </>
              ) : (
                // Auth flow
                <>
                  <Stack.Screen 
                    name="Login" 
                    component={LoginScreen}
                    options={{
                      animationTypeForReplace: 'pop',
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen 
                    name="Signup" 
                    component={SignupScreen}
                    options={{
                      headerShown: true,
                      title: 'Create Account',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="CreatePassword" 
                    component={CreatePasswordScreen}
                    options={{
                      headerShown: true,
                      title: 'Create Password',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="SelectInterests" 
                    component={SelectInterestsScreen}
                    options={{
                      headerShown: true,
                      title: 'Select Interests',
                      headerBackTitle: 'Back',
                    }}
                  />
                  <Stack.Screen 
                    name="CommunityOnboarding" 
                    component={CommunityOnboardingScreen}
                    options={{
                      headerShown: true,
                      title: 'Join Communities',
                      headerBackTitle: 'Back',
                    }}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </MenuProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}