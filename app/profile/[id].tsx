import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProfileScreen from '../profile';

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  
  return <ProfileScreen />;
}