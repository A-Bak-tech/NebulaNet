import React from 'react';
import { View, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { WaitlistForm } from '@/components/auth/WaitlistForm';
import { Header } from '@/components/layout/Header';

export default function WaitlistScreen() {
  const handleWaitlistSuccess = (email: string) => {
    console.log('Joined waitlist:', email);
    // You can navigate to a success screen or show a confirmation
  };

  return (
    <ScreenWrapper>
      <Header title="Join Waitlist" showBack />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center p-6">
          <WaitlistForm onSuccess={handleWaitlistSuccess} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}