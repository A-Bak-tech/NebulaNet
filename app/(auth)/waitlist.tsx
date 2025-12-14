import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, User, Sparkles, ArrowLeft } from 'lucide-react-native';

export default function WaitlistScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { joinWaitlist } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      await joinWaitlist(
        formData.email,
        formData.name || undefined,
        formData.reason || undefined
      );
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to join waitlist. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 40,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
    },
    form: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.ui.border,
      paddingHorizontal: 16,
    },
    input: {
      flex: 1,
      height: 56,
      fontSize: 16,
      color: colors.text.primary,
      paddingVertical: 16,
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
      paddingVertical: 16,
    },
    icon: {
      marginRight: 12,
    },
    successContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.status.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    successText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    submitButton: {
      backgroundColor: colors.ui.primary,
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.inverse,
    },
    loginButton: {
      borderWidth: 1,
      borderColor: colors.ui.border,
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    infoText: {
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.icon.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Join Waitlist</Text>
            <Text style={styles.subtitle}>
              Get early access to NebulaNet features
            </Text>
          </View>
        </View>

        {isSubmitted ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Sparkles size={40} color={colors.status.success} />
            </View>
            <Text style={styles.successTitle}>You&apos;re on the list!</Text>
            <Text style={styles.successText}>
              Thanks for your interest in NebulaNet! We&apos;ll notify you at{' '}
              <Text style={{ fontWeight: '600', color: colors.text.primary }}>
                {formData.email}
              </Text>{' '}
              when your spot is ready.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={colors.icon.secondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.placeholder}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name (Optional)</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color={colors.icon.secondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.text.placeholder}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Why are you interested? (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us what excites you about NebulaNet..."
                  placeholderTextColor={colors.text.placeholder}
                  value={formData.reason}
                  onChangeText={(value) => handleInputChange('reason', value)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <Text style={styles.infoText}>
              By joining the waitlist, you agree to receive updates about NebulaNet.
              We&apos;ll never share your email with third parties.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={isSubmitted ? handleLogin : handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : isSubmitted ? (
            <Text style={styles.submitButtonText}>Back to Login</Text>
          ) : (
            <Text style={styles.submitButtonText}>Join Waitlist</Text>
          )}
        </TouchableOpacity>

        {!isSubmitted && (
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Already have access? Sign in</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}