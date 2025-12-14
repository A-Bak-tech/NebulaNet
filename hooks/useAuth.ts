import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Optional: Create specific auth hooks for convenience
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useIsAdmin = () => {
  const { canAdmin } = useAuth();
  return canAdmin();
};

export const useIsLoading = () => {
  const { isLoading } = useAuth();
  return isLoading;
};