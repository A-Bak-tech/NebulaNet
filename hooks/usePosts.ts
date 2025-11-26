import { useState, useEffect, useRef, useCallback } from 'react';
import { Post } from '@/types/database';
import { posts } from '@/lib/posts';

export const usePosts = () => {
  const [feed, setFeed] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const loadFeed = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return;

    setIsLoading(true);
    try {
      const pageToFetch = reset ? 0 : pageRef.current;
      const newPosts = await posts.getFeed(pageToFetch, 20);

      if (reset) {
        setFeed(newPosts);
        setPage(1);
      } else {
        setFeed(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }

      setHasMore(newPosts.length === 20);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFeed = () => {
    loadFeed(true);
  };

  useEffect(() => {
    loadFeed(true);
  }, [loadFeed]);

  return {
    feed,
    isLoading,
    hasMore,
    loadMore: () => loadFeed(false),
    refresh: refreshFeed,
  };
};