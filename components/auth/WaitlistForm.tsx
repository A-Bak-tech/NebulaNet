import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../lib/auth';

interface WaitlistFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
  compact?: boolean;
}

const WaitlistForm: React.FC<WaitlistFormProps> = ({
  onSuccess,
  showTitle = true,
  compact = false,
}) => {
  const { joinWaitlist } = useAuth();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    // Validate email
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);

      await joinWaitlist(email, name.trim() || undefined, reason.trim() || undefined);
      
      setIsSuccess(true);
      setEmail('');
      setName('');
      setReason('');

      if (onSuccess) {
        onSuccess();
      }

      Alert.alert(
        'Success!',
        "You're on the waitlist! We'll notify you when you get access.",
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && compact) {
    return (
      <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <Text className="text-green-800 dark:text-green-300 text-center font-medium">
          ✓ You&apos;re on the waitlist!
        </Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View className="space-y-3">
        <TextInput
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
        
        <TouchableOpacity
          className={`bg-purple-600 rounded-lg py-3 ${isSubmitting ? 'opacity-70' : ''}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Join Waitlist
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800 my-auto">
          {showTitle && (
            <>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Join the Waitlist
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Get early access to NebulaNet. We&apos;re currently in beta.
              </Text>
            </>
          )}

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
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
                Your Name (Optional)
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Why are you interested? (Optional)
              </Text>
              <TextInput
                className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white min-h-[80px]"
                placeholder="Tell us what excites you about NebulaNet..."
                placeholderTextColor="#9CA3AF"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              className={`bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg py-4 mt-2 ${
                isSubmitting ? 'opacity-70' : ''
              }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text className="text-white ml-2 font-semibold">
                    Joining...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Join Waitlist
                </Text>
              )}
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              By joining, you agree to receive updates about NebulaNet.
              We&apos;ll never spam you or share your email.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WaitlistForm;