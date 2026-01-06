import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all screens
import HomeScreen from '../screens/main/HomeScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';
import SelectInterestsScreen from '../screens/auth/SelectInterestsScreen';
import CommunityOnboardingScreen from '../screens/auth/CommunityOnboardingScreen';
import CreatePostScreen from '../screens/post/CreatePostScreen';
import CommentsScreen from '../screens/post/CommentsScreen';
import NotificationsScreen from '../screens/notification/NotificationsScreen';
import InviteScreen from '../screens/invite/InviteScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Colors
const COLORS = {
  primary: '#007AFF',
  secondary: '#8E8E93',
  background: '#FFFFFF',
};

// Deep linking configuration
const linking = {
  prefixes: [
    'nebulanet://',
    'https://nebulanet.space',
    'exp://nebulanet.space',
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: 'home',
          ExploreTab: 'explore',
          ChatTab: 'chat',
          ProfileTab: 'profile',
        },
      },
      PostDetail: 'post/:id',
      Comments: 'post/:id/comments',
      Profile: 'user/:id',
      Invite: 'invite/:code',
      Settings: 'settings',
      Auth: 'auth',
    },
  },
};

// Loading/Splash Screen Component
function LoadingScreen() {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require('../assets/images/splash-screen-c.jpg')}
        style={styles.splashImage}
        resizeMode="cover"
      />
      <ActivityIndicator 
        size="large" 
        color="#007AFF" 
        style={styles.loader}
      />
    </View>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ExploreTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ 
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="ExploreTab" 
        component={ExploreScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="CreatePassword" component={CreatePasswordScreen} />
      <Stack.Screen name="SelectInterests" component={SelectInterestsScreen} />
      <Stack.Screen name="CommunityOnboarding" component={CommunityOnboardingScreen} />
    </Stack.Navigator>
  );
}

// Main Stack Navigator (for authenticated users)
function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Comments" component={CommentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="PostDetail" component={CommentsScreen} />
    </Stack.Navigator>
  );
}

// Root App Navigator
export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = async (event) => {
      if (!event?.url) return;
      
      const { hostname, path, queryParams } = Linking.parse(event.url);
      console.log('Deep link received:', { hostname, path, queryParams });
      
      // Handle invite codes
      if (path === 'invite' && queryParams?.code) {
        await AsyncStorage.setItem('invite_code', queryParams.code);
        console.log('Invite code saved:', queryParams.code);
      }
      
      // Handle post links
      if (path === 'post' && queryParams?.id) {
        setInitialRoute('PostDetail');
        // Store postId for later use
        await AsyncStorage.setItem('deep_link_post_id', queryParams.id);
      }
      
      // Handle user profile links
      if (path === 'user' && queryParams?.id) {
        setInitialRoute('Profile');
        await AsyncStorage.setItem('deep_link_user_id', queryParams.id);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Check auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer 
      linking={linking} 
      fallback={<LoadingScreen />}
      onStateChange={(state) => {
        // Optional: Track navigation state changes
        console.log('Navigation state changed:', state);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {session ? (
          // Authenticated user flow
          <Stack.Screen 
            name="Main" 
            component={MainStackNavigator}
            initialParams={{ initialRoute }}
          />
        ) : (
          // Auth flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});