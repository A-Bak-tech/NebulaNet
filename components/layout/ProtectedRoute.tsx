import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from '../ui/Loader';
import { Redirect } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Loader 
        size="large" 
        text="Checking authentication..." 
        className="flex-1 justify-center" 
      />
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'moderator') {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
};