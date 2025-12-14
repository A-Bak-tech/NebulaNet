import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Sparkles, CheckCircle, XCircle } from 'lucide-react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { checkAuthStatus } = useAuth();
  const params = useLocalSearchParams();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Check if email was just verified
    if (params.verified === 'true') {
      setVerificationStatus('success');
      startCountdown();
    }
  }, [params]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && verificationStatus === 'success') {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && verificationStatus === 'success') {
      redirectToApp();
    }
    return () => clearTimeout(timer);
  }, [countdown, verificationStatus]);

  const startCountdown = () => {
    setCountdown(5); // 5 second countdown
  };

  const redirectToApp = () => {
    router.replace('/(tabs)');
  };

  const handleResendEmail = async () => {
    // TODO: Implement resend verification email
    Alert.alert('Info', 'Resend email functionality will be implemented soon.');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
      paddingHorizontal: 24,
      paddingVertical: 40,
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    pendingIcon: {
      backgroundColor: colors.ui.primary + '20',
    },
    successIcon: {
      backgroundColor: colors.status.success + '20',
    },
    errorIcon: {
      backgroundColor: colors.status.error + '20',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 24,
    },
    emailText: {
      fontWeight: '600',
      color: colors.text.primary,
    },
    countdownText: {
      fontSize: 14,
      color: colors.ui.primary,
      fontWeight: '600',
      marginTop: 8,
    },
    actions: {
      width: '100%',
      marginTop: 32,
    },
    primaryButton: {
      backgroundColor: colors.ui.primary,
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.inverse,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: colors.ui.border,
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          verificationStatus === 'pending' && styles.pendingIcon,
          verificationStatus === 'success' && styles.successIcon,
          verificationStatus === 'error' && styles.errorIcon,
        ]}>
          {verificationStatus === 'pending' && (
            <Mail size={40} color={colors.ui.primary} />
          )}
          {verificationStatus === 'success' && (
            <CheckCircle size={40} color={colors.status.success} />
          )}
          {verificationStatus === 'error' && (
            <XCircle size={40} color={colors.status.error} />
          )}
        </View>

        <Text style={styles.title}>
          {verificationStatus === 'pending' && 'Check Your Email'}
          {verificationStatus === 'success' && 'Email Verified!'}
          {verificationStatus === 'error' && 'Verification Failed'}
        </Text>

        <Text style={styles.subtitle}>
          {verificationStatus === 'pending' && (
            <>
              We&apos;ve sent a verification link to your email address.
              Please click the link to verify your account.
            </>
          )}
          {verificationStatus === 'success' && (
            'Your email has been successfully verified! Redirecting to the app...'
          )}
          {verificationStatus === 'error' && (
            'There was an issue verifying your email. Please try again.'
          )}
        </Text>

        {verificationStatus === 'success' && countdown > 0 && (
          <Text style={styles.countdownText}>
            Redirecting in {countdown} seconds...
          </Text>
        )}

        <View style={styles.actions}>
          {verificationStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResendEmail}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.primaryButtonText}>Resend Verification Email</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLogin}
              >
                <Text style={styles.secondaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {verificationStatus === 'success' && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={redirectToApp}
            >
              <Text style={styles.primaryButtonText}>Continue to App</Text>
            </TouchableOpacity>
          )}

          {verificationStatus === 'error' && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResendEmail}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLogin}
              >
                <Text style={styles.secondaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}