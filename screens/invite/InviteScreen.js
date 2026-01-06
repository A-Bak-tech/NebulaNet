import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SMSInviteService } from '../../services/smsInvite';

const InviteScreen = () => {
  const [inviteCode, setInviteCode] = useState('NEBULA-7A9B3C');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const inviteLink = `https://nebulanet.space/invite/${inviteCode}`;

  const copyInviteLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const shareInvite = async () => {
    try {
      const message = `👋 Join me on NebulaNet!\n\nGet the app: ${inviteLink}\n\nUse invite code: ${inviteCode}`;
      
      const result = await Share.share({
        message,
        title: 'Join NebulaNet',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const sendSMSInvite = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsSending(true);
    try {
      const result = await SMSInviteService.sendInvite(
        [phoneNumber],
        inviteCode,
        'Your Friend'
      );

      if (result.success) {
        Alert.alert('Success!', 'Invite sent via SMS');
        setPhoneNumber('');
      } else {
        Alert.alert('Error', result.message || 'Failed to send SMS');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const inviteMethods = [
    {
      id: 'whatsapp',
      icon: 'logo-whatsapp',
      name: 'WhatsApp',
      color: '#25D366',
    },
    {
      id: 'imessage',
      icon: 'chatbubble',
      name: 'iMessage',
      color: '#007AFF',
    },
    {
      id: 'telegram',
      icon: 'paper-plane',
      name: 'Telegram',
      color: '#0088CC',
    },
    {
      id: 'more',
      icon: 'ellipsis-horizontal',
      name: 'More',
      color: '#8E8E93',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invite Friends</Text>
          <Text style={styles.headerSubtitle}>
            Share your link invite
          </Text>
        </View>

        {/* Invite Code Card */}
        <View style={styles.inviteCard}>
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Your Invite Code</Text>
            <Text style={styles.inviteCode}>{inviteCode}</Text>
          </View>
          
          <View style={styles.inviteLinkContainer}>
            <Text style={styles.inviteLinkLabel}>Invite Link</Text>
            <View style={styles.linkRow}>
              <Text style={styles.inviteLink} numberOfLines={1}>
                {inviteLink}
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={copyInviteLink}
              >
                <MaterialIcons name="content-copy" size={20} color="#007AFF" />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SMS Invite Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send via SMS</Text>
          <View style={styles.smsContainer}>
            <View style={styles.phoneInputContainer}>
              <Ionicons name="call-outline" size={20} color="#8E8E93" />
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor="#8E8E93"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
              onPress={sendSMSInvite}
              disabled={isSending}
            >
              <Text style={styles.sendButtonText}>
                {isSending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Share Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share via</Text>
          <View style={styles.shareOptions}>
            {inviteMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.shareOption}
                onPress={shareInvite}
              >
                <View style={[styles.shareIcon, { backgroundColor: method.color + '20' }]}>
                  <Ionicons name={method.icon} size={24} color={method.color} />
                </View>
                <Text style={styles.shareOptionName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Invites Sent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>67%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Invite Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Invite Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="gift-outline" size={20} color="#34C759" />
            <Text style={styles.benefitText}>
              Get 100 Nebula Coins for each friend who joins
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="flash-outline" size={20} color="#FF9500" />
            <Text style={styles.benefitText}>
              Unlock exclusive features when you invite 5+ friends
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="star-outline" size={20} color="#5856D6" />
            <Text style={styles.benefitText}>
              Earn "Community Builder" badge
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Share Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareInvite}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 4,
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inviteCodeContainer: {
    marginBottom: 20,
  },
  inviteCodeLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 1,
  },
  inviteLinkContainer: {
    marginBottom: 20,
  },
  inviteLinkLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteLink: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF10',
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  smsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sendButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  shareIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionName: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginBottom: 100,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  shareButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InviteScreen;