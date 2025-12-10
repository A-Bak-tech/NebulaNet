import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  onSignUp,
}) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="w-full space-y-4">
      <View>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </Text>
        <TextInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isSubmitting}
        />
      </View>

      <View>
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </Text>
        <TextInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!isSubmitting}
        />
        <TouchableOpacity
          className="absolute right-3 top-3"
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text className="text-purple-600 dark:text-purple-400 text-sm">
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      {onForgotPassword && (
        <TouchableOpacity onPress={onForgotPassword}>
          <Text className="text-purple-600 dark:text-purple-400 text-sm text-right">
            Forgot password?
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className={`bg-purple-600 rounded-lg py-3 ${isSubmitting ? 'opacity-70' : ''}`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Sign In
          </Text>
        )}
      </TouchableOpacity>

      {onSignUp && (
        <View className="flex-row justify-center items-center mt-4">
          <Text className="text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onSignUp}>
            <Text className="text-purple-600 dark:text-purple-400 font-semibold">
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LoginForm;