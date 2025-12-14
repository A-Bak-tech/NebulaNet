import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { View, StatusBar, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

// Admin-only components
import AdminSidebar from '../components/layout/AdminSidebar';
import AdminBottomNav from '../components/layout/AdminBottomNav';

// Regular user components
import BottomNav from '../components/layout/BottomNav';

// Loading screen
import LoadingScreen from '../components/layout/LoadingScreen';

// Root content component
function RootContent() {
  const { user, isLoading, canAdmin } = useAuth(); // Use canAdmin() from your AuthContext
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Admin layout with sidebar
  if (canAdmin()) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar for web/admin */}
        {Platform.OS === 'web' && (
          <AdminSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main content */}
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="profile/[id]" />
            <Stack.Screen name="waitlist" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="messages" />
          </Stack>
          
          {/* Mobile bottom nav for admin */}
          {Platform.OS !== 'web' && (
            <AdminBottomNav onMenuPress={() => setIsSidebarOpen(true)} />
          )}
        </View>
        
        {/* Mobile sidebar overlay */}
        {Platform.OS !== 'web' && isSidebarOpen && (
          <AdminSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            mobile
          />
        )}
      </View>
    );
  }

  // Regular user layout (just bottom nav)
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="waitlist" />
        <Stack.Screen name="messages" />
      </Stack>
      
      {/* Regular bottom nav for mobile */}
      {Platform.OS !== 'web' && <BottomNav />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar barStyle="default" />
          <RootContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}