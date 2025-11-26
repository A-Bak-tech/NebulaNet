import React from 'react';
import { View, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { WaitlistTable } from '@/components/admin/WaitlistTable';

export default function WaitlistManagementScreen() {
  return (
    <ScreenWrapper>
      <Header title="Waitlist Management" showBack />
      <ScrollView className="flex-1">
        <WaitlistTable />
      </ScrollView>
    </ScreenWrapper>
  );
}