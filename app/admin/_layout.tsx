import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { user } = useAuth();

  // Redirect non-admin users
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ai-dashboard" />
      <Stack.Screen name="moderation" />
      <Stack.Screen name="waitlist-management" />
      <Stack.Screen name="insights" />
    </Stack>
  );
}