import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Link } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/utils/helpers';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.username || !form.fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(form.email, form.password, {
        username: form.username,
        full_name: form.fullName,
        email: form.email,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Join NebulaNet
          </Text>

          {error ? (
            <View className="bg-red-100 border border-red-400 rounded-lg p-3 mb-4 w-full">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={form.fullName}
            onChangeText={(value) => updateField('fullName', value)}
            className="w-full"
          />

          <Input
            label="Username"
            placeholder="Choose a username"
            value={form.username}
            onChangeText={(value) => updateField('username', value)}
            autoCapitalize="none"
            className="w-full"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={form.email}
            onChangeText={(value) => updateField('email', value)}
            autoCapitalize="none"
            keyboardType="email-address"
            className="w-full"
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={form.password}
            onChangeText={(value) => updateField('password', value)}
            secureTextEntry
            className="w-full"
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChangeText={(value) => updateField('confirmPassword', value)}
            secureTextEntry
            className="w-full"
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            className="w-full mb-4"
          />

          <View className="flex-row">
            <Text className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary-500 font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}