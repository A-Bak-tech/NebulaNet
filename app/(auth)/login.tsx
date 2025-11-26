import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Link } from 'expo-router';
import { LoginForm } from '@/components/auth/LoginForm';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';

export default function LoginScreen() {
  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6">
          <LoginForm />
          
          <View className="mt-8 flex-row">
            <Text className="text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary-500 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}