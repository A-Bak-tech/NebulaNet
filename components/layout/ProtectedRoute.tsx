import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { SPACING } from '../../constants/Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireModerator?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireModerator = false,
  redirectTo = '/',
}) => {
  const { user, isLoading, isAuthenticated, canAdmin, canModerate } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === 'admin';

    // Redirect logic
    if (requireAuth && !isAuthenticated && !inAuthGroup) {
      // Not authenticated but trying to access protected route
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Already authenticated but trying to access auth pages
      router.replace('/(tabs)');
    } else if (requireAdmin && !canAdmin()) {
      // Requires admin but user is not admin
      router.replace(redirectTo);
    } else if (requireModerator && !canModerate()) {
      // Requires moderator but user cannot moderate
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, segments, requireAuth, requireAdmin, requireModerator]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Check permissions
  if (requireAdmin && !canAdmin()) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          You don't have permission to access this page.
        </Text>
      </View>
    );
  }

  if (requireModerator && !canModerate()) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Moderator Access Required
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center">
          This page is only accessible to moderators and admins.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;