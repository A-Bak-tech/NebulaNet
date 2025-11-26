import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, Users, Sparkles } from 'lucide-react-native';

interface WaitlistFormProps {
  onSuccess?: (email: string) => void;
}

export const WaitlistForm: React.FC<WaitlistFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
      onSuccess?.(email);
    } catch (error) {
      console.error('Error joining waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <View className="items-center justify-center p-8">
        <View className="bg-green-100 dark:bg-green-900 rounded-full p-4 mb-4">
          <Sparkles size={48} color="#10b981" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          You&apos;re on the list!
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We&apos;ve added {email} to our waitlist. We&apos;ll notify you when your spot is ready.
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Position in line: #1,234
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full max-w-sm">
      <View className="items-center mb-8">
        <View className="bg-primary-100 dark:bg-primary-900 rounded-full p-3 mb-4">
          <Users size={32} color="#0ea5e9" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Join the Waitlist
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          Be among the first to experience NebulaNet. We&apos;re rolling out access gradually.
        </Text>
      </View>

      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        icon={Mail}
        className="mb-4"
      />

      <Input
        label="Referral Code (Optional)"
        placeholder="Enter referral code"
        value={referralCode}
        onChangeText={setReferralCode}
        className="mb-6"
      />

      <Button
        title="Join Waitlist"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!email}
        className="w-full mb-4"
      />

      <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By joining, you agree to receive updates about NebulaNet. We respect your privacy.
      </Text>
    </View>
  );
};