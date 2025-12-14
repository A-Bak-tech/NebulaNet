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
import { User, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    if (!formData.username.trim()) {
      Alert.alert('Error', 'Please choose a username');
      return false;
    }

    if (formData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return false;
    }

    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsRegistering(true);
      await register(
        formData.email,
        formData.password,
        formData.username,
        formData.displayName || undefined
      );
      // Navigation is handled by AuthContext
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsRegistering(false);
    }
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
      alignItems: 'center',
      marginBottom: 40,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    logoText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginLeft: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 16,
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
    icon: {
      marginRight: 12,
    },
    passwordToggle: {
      padding: 8,
    },
    registerButton: {
      backgroundColor: colors.ui.primary,
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    registerButtonDisabled: {
      opacity: 0.7,
    },
    registerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.inverse,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    loginText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ui.primary,
      marginLeft: 4,
    },
    passwordRequirements: {
      marginTop: 8,
    },
    requirementText: {
      fontSize: 12,
      color: colors.text.tertiary,
      marginBottom: 2,
    },
    requirementMet: {
      color: colors.status.success,
    },
  });

  const passwordRequirements = [
    {
      text: 'At least 6 characters',
      met: formData.password.length >= 6,
    },
    {
      text: 'Passwords match',
      met: formData.password === formData.confirmPassword && formData.password.length > 0,
    },
  ];

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
          <View style={styles.logoContainer}>
            <Sparkles size={32} color={colors.ui.primary} />
            <Text style={styles.logoText}>NebulaNet</Text>
          </View>
          <Text style={styles.subtitle}>
            Create your account to start exploring
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
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
                editable={!isRegistering && !isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.icon.secondary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={colors.text.placeholder}
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
                autoComplete="username"
                editable={!isRegistering && !isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name (Optional)</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={colors.icon.secondary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="How people will see you"
                placeholderTextColor={colors.text.placeholder}
                value={formData.displayName}
                onChangeText={(value) => handleInputChange('displayName', value)}
                editable={!isRegistering && !isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.icon.secondary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={colors.text.placeholder}
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                editable={!isRegistering && !isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.icon.secondary} />
                ) : (
                  <Eye size={20} color={colors.icon.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.icon.secondary} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={colors.text.placeholder}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                editable={!isRegistering && !isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.icon.secondary} />
                ) : (
                  <Eye size={20} color={colors.icon.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.passwordRequirements}>
            {passwordRequirements.map((req, index) => (
              <Text
                key={index}
                style={[
                  styles.requirementText,
                  req.met && styles.requirementMet,
                ]}
              >
                • {req.text}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              (isRegistering || isLoading) && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isRegistering || isLoading}
          >
            {isRegistering ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}