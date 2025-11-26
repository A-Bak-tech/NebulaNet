import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminScreen() {
  return (
    <ScreenWrapper>
      <Header title="Admin Dashboard" showBack />
      <ScrollView className="flex-1">
        <AdminPanel />
      </ScrollView>
    </ScreenWrapper>
  );
}