import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Appearance,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  Lock, 
  Mail, 
  Shield, 
  LogOut,
  ChevronRight 
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const SettingsScreen = () => {
  const colorScheme = useColorScheme();
  const [theme, setTheme] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
      
      // Load other settings from database
      if (user?.id) {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setEmailNotifications(data.email_notifications);
          setPushNotifications(data.push_notifications);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    
    try {
      await AsyncStorage.setItem('theme', newTheme);
      
      if (newTheme !== 'system') {
        // You would need to implement your own theme context
        // For now, we'll just update AsyncStorage
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleNotificationToggle = async (type: 'email' | 'push', value: boolean) => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      if (type === 'email') {
        setEmailNotifications(value);
      } else {
        setPushNotifications(value);
      }
      
      // Update in database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: type === 'email' ? value : emailNotifications,
          push_notifications: type === 'push' ? value : pushNotifications,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.clear();
              // Navigate to login screen
              // router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const getCurrentThemeName = () => {
    if (theme === 'system') {
      return colorScheme === 'dark' ? 'Dark' : 'Light';
    }
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  const settingsSections = [
    {
      title: 'Display',
      items: [
        {
          id: 'theme',
          icon: theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor,
          label: 'Theme',
          description: `Currently: ${getCurrentThemeName()}`,
          action: () => {}, // Would open theme selector modal
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          icon: User,
          label: 'Profile Information',
          description: 'Update your profile details',
          action: () => {}, // Navigate to edit profile
        },
        {
          id: 'password',
          icon: Lock,
          label: 'Change Password',
          description: 'Manage your password',
          action: () => {}, // Navigate to change password
        },
        {
          id: 'email',
          icon: Mail,
          label: 'Email Preferences',
          description: 'Control email notifications',
          action: () => {}, // Navigate to email settings
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          type: 'switch',
          value: emailNotifications,
          onValueChange: (value: boolean) => handleNotificationToggle('email', value),
        },
        {
          id: 'push-notifications',
          label: 'Push Notifications',
          type: 'switch',
          value: pushNotifications,
          onValueChange: (value: boolean) => handleNotificationToggle('push', value),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'privacy',
          icon: Shield,
          label: 'Privacy Settings',
          description: 'Manage your privacy preferences',
          action: () => {}, // Navigate to privacy settings
        },
        {
          id: 'private-account',
          icon: Shield,
          label: 'Private Account',
          description: 'Making a private account',
          action: () => {}, // Toggle private account
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          id: 'logout',
          icon: LogOut,
          label: 'Logout',
          color: '#FF3B30',
          action: handleLogout,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionItems}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                onPress={item.action}
                disabled={item.type === 'switch' || loading}
              >
                {item.icon && (
                  <View style={styles.iconContainer}>
                    <item.icon 
                      size={20} 
                      color={item.color || '#666'} 
                    />
                  </View>
                )}
                
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, item.color && { color: item.color }]}>
                    {item.label}
                  </Text>
                  {item.description && (
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  )}
                </View>

                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                    thumbColor="#fff"
                    disabled={loading}
                  />
                ) : (
                  <ChevronRight size={20} color="#999" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Theme Selector Modal would go here */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          Version {Updates.runtimeVersion || '1.0.0'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionItems: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SettingsScreen;