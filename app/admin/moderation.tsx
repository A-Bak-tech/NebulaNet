import React from 'react';
import { View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { ContentQueue } from '@/components/admin/ContentQueue';

export default function ModerationScreen() {
  return (
    <ScreenWrapper>
      <Header title="Content Moderation" showBack />
      <ContentQueue />
    </ScreenWrapper>
  );
}