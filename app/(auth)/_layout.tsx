import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const colors = useThemeColors();

  return (
    <>
      <StatusBar style={colors.text.primary === '#FFFFFF' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="waitlist" />
      </Stack>
    </>
  );
}