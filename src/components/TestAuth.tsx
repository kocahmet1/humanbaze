import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { theme } from '../styles/theme';

export const TestAuth: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const testFirebaseConnection = () => {
    console.log('Firebase Auth object:', auth);
    console.log('Auth config:', auth?.config);
    Alert.alert('Check Console', 'Firebase connection info logged to console');
  };

  const handleRegister = async () => {
    if (!auth) {
      Alert.alert('Error', 'Firebase Auth not initialized');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to register with:', email, password);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful:', userCredential.user);
      Alert.alert('Success', `User created: ${userCredential.user.email}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!auth) {
      Alert.alert('Error', 'Firebase Auth not initialized');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to login with:', email, password);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user);
      Alert.alert('Success', `Logged in: ${userCredential.user.email}`);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Auth Test</Text>
      
      <TouchableOpacity style={styles.testButton} onPress={testFirebaseConnection}>
        <Text style={styles.buttonText}>Test Firebase Connection</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.loginButton, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging In...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: theme.colors.info,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  input: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    fontFamily: theme.fonts.regular,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
});
