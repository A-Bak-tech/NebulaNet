import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { FeedList } from '@/components/feed/FeedList';
import { Header } from '@/components/layout/Header';
import { usePosts } from '@/hooks/usePosts';

export default function HomeScreen() {
  const { feed, isLoading, refresh, loadMore } = usePosts();

  return (
    <ScreenWrapper>
      <Header title="NebulaNet" showLogo />
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        <FeedList 
          posts={feed}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}