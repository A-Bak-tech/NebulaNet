import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full max-w-sm">
      <Text className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
        Welcome Back
      </Text>

      {error ? (
        <View className="bg-red-100 border border-red-400 rounded-lg p-3 mb-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      ) : null}

      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        className="w-full mb-4"
      />

      <TouchableOpacity>
        <Text className="text-primary-500 text-center text-sm">
          Forgot your password?
        </Text>
      </TouchableOpacity>
    </View>
  );
};