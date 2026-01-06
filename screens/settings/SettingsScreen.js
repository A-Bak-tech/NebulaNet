import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = React.useState(true);

  const settingsSections = [
    {
      title: 'Personalization & Preferences',
      items: [
        {
          icon: 'person-circle-outline',
          name: 'Account Center',
          subtitle: 'Manage your connected accounts',
          type: 'navigate',
          screen: 'AccountCenter',
        },
        {
          icon: 'newspaper-outline',
          name: 'Feed Preferences',
          subtitle: 'Control what you see',
          type: 'navigate',
          screen: 'FeedPreferences',
        },
        {
          icon: 'bookmark-outline',
          name: 'Saved & Hidden Content',
          subtitle: 'View your saved posts',
          type: 'navigate',
          screen: 'SavedContent',
        },
        {
          icon: 'language-outline',
          name: 'Language & Region',
          subtitle: 'English (US)',
          type: 'navigate',
          screen: 'LanguageRegion',
        },
      ],
    },
    {
      title: 'Account & Security',
      items: [
        {
          icon: 'lock-closed-outline',
          name: 'Privacy & Visibility',
          subtitle: 'Who can see your content',
          type: 'navigate',
          screen: 'PrivacySettings',
        },
        {
          icon: 'ban-outline',
          name: 'Blocked & Muted Accounts',
          subtitle: 'Manage your block list',
          type: 'navigate',
          screen: 'BlockedAccounts',
        },
        {
          icon: 'notifications-outline',
          name: 'Community Notifications',
          subtitle: 'Control notifications',
          type: 'toggle',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          icon: 'shield-checkmark-outline',
          name: 'Security & Login',
          subtitle: 'Password, 2FA, login activity',
          type: 'navigate',
          screen: 'SecuritySettings',
        },
        {
          icon: 'link-outline',
          name: 'Linked Accounts',
          subtitle: 'Instagram, Spotify, etc.',
          type: 'navigate',
          screen: 'LinkedAccounts',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'moon-outline',
          name: 'Dark Mode',
          subtitle: 'Switch between themes',
          type: 'toggle',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          icon: 'play-circle-outline',
          name: 'Auto-play Videos',
          subtitle: 'Play videos automatically',
          type: 'toggle',
          value: autoPlayVideos,
          onValueChange: setAutoPlayVideos,
        },
        {
          icon: 'cloud-upload-outline',
          name: 'Data Usage',
          subtitle: 'Wi-Fi only, data saver',
          type: 'navigate',
          screen: 'DataUsage',
        },
        {
          icon: 'download-outline',
          name: 'Download Preferences',
          subtitle: 'Auto-download settings',
          type: 'navigate',
          screen: 'DownloadSettings',
        },
      ],
    },
    {
      title: 'Support & About',
      items: [
        {
          icon: 'help-circle-outline',
          name: 'Help Center',
          subtitle: 'Get help with NebulaNet',
          type: 'navigate',
          screen: 'HelpCenter',
        },
        {
          icon: 'document-text-outline',
          name: 'Terms & Policies',
          subtitle: 'Terms of Service, Privacy Policy',
          type: 'navigate',
          screen: 'TermsPolicies',
        },
        {
          icon: 'information-circle-outline',
          name: 'About NebulaNet',
          subtitle: 'Version 1.0.0',
          type: 'navigate',
          screen: 'About',
        },
        {
          icon: 'people-outline',
          name: 'Invite Friends',
          subtitle: 'Share NebulaNet',
          type: 'navigate',
          screen: 'Invite',
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            // Handle logout
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const handleAccountDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfoCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>SM</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>Shaveya Malik</Text>
            <Text style={styles.userHandle}>@shaveyamlk</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.settingItem}
                  onPress={() => {
                    if (item.type === 'navigate') {
                      navigation.navigate(item.screen);
                    }
                  }}
                  disabled={item.type === 'toggle'}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={item.icon} size={22} color="#8E8E93" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingName}>{item.name}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                <Text style={[styles.settingName, styles.dangerText]}>
                  Log Out
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleAccountDelete}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                <Text style={[styles.settingName, styles.dangerText]}>
                  Delete Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>NebulaNet v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 NebulaNet.space</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  editProfileText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5EA',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dangerItem: {
    backgroundColor: '#FFF5F5',
  },
  dangerText: {
    color: '#FF3B30',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});

export default SettingsScreen;