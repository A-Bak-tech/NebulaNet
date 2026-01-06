// services/smsInvite.js
import * as SMS from 'expo-sms';
import { supabase } from './supabase';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

export const generateInviteLink = (userId, inviteCode) => {
  return `https://nebulanet.space/invite/${inviteCode}`;
};

export const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const saveInviteToDatabase = async (inviterId, inviteCode) => {
  try {
    await supabase
      .from('invites')
      .insert({
        inviter_id: inviterId,
        invite_code: inviteCode,
        used: false
      });
  } catch (error) {
    console.error('Error saving invite:', error);
  }
};

export const sendSMSInvite = async (phoneNumber, inviteCode, userName) => {
  try {
    const inviteLink = generateInviteLink(userName, inviteCode);
    const message = `Join me on NebulaNet! ${userName} has invited you to join NebulaNet. Click here to join: ${inviteLink}`;
    
    const { result } = await SMS.sendSMSAsync(
      [phoneNumber],
      message
    );
    
    return result === 'sent';
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export const copyInviteLink = async (inviteCode, userName) => {
  const inviteLink = generateInviteLink(userName, inviteCode);
  await Clipboard.setStringAsync(inviteLink);
  Alert.alert('Success', 'Invite link copied to clipboard!');
};

export const handleInviteClick = async (inviteCode, navigation) => {
  try {
    // Verify invite code
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('used', false)
      .single();

    if (data) {
      // Mark as used
      await supabase
        .from('invites')
        .update({ used: true })
        .eq('id', data.id);

      // Navigate to signup with referral
      navigation.navigate('Signup', { referrerId: data.inviter_id });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error handling invite:', error);
    return false;
  }
};