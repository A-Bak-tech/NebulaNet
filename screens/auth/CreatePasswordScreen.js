// screens/auth/CreatePasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

export default function CreatePasswordScreen({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { email, username, fullName, phone } = route.params || {};

  const handleCreateAccount = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check password strength
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
      Alert.alert('Weak Password', 'Include letters, numbers, and symbols');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            phone
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert(
          'Success!',
          'Account created. Check your email to verify.',
          [{ text: 'OK', onPress: () => navigation.navigate('SelectInterests') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1DA1F2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Secure your account</Text>
        <Text style={styles.subtitle}>Create a strong password</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#657786" 
            />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />

        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={password.length >= 8 ? "#00C851" : "#657786"} 
            />
            <Text style={styles.requirementText}>At least 8 characters</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[a-zA-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[a-zA-Z]/.test(password) ? "#00C851" : "#657786"} 
            />
            <Text style={styles.requirementText}>Contains letters</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/\d/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/\d/.test(password) ? "#00C851" : "#657786"} 
            />
            <Text style={styles.requirementText}>Contains numbers</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "#00C851" : "#657786"} 
            />
            <Text style={styles.requirementText}>Contains symbols</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          By continuing, you agree to NebulaNet's Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#14171A',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#657786',
    marginBottom: 30,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  requirements: {
    backgroundColor: '#F5F8FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#14171A',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    color: '#657786',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#AAB8C2',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    textAlign: 'center',
    color: '#657786',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 40,
  },
});