import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  const handleContinue = () => {
    if (phoneNumber.length >= 10) {
      navigation.navigate('CreatePassword');
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Your Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>
          Sign up to personalize your experience.
        </Text>

        {/* Email/Phone Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, styles.toggleButtonActive]}>
            <Text style={[styles.toggleButtonText, styles.toggleButtonTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Input */}
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCode}>+1</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="882 9983 2233"
            placeholderTextColor="#8E8E93"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        <Text style={styles.orText}>or</Text>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            phoneNumber.length >= 10 && styles.continueButtonActive,
          ]}
          onPress={handleContinue}
          disabled={phoneNumber.length < 10}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Already have account */}
        <TouchableOpacity onPress={handleSignup} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 4,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 30,
  },
  countryCodeContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  countryCode: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  orText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonActive: {
    backgroundColor: '#007AFF',
  },
  continueButtonText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loginTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default LoginScreen;