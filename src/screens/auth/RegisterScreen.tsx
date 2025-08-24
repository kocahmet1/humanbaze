import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { registerWithEmail, loginWithGoogle, clearError } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';
import { navigate, homePath } from '../../utils/navigation';

export const RegisterScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const validateForm = () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleEmailRegister = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(registerWithEmail({ 
        email, 
        password, 
        displayName: displayName.trim() 
      })).unwrap();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Failed to create account');
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Failed to register with Google');
    }
  };

  const navigateToLogin = () => {
    dispatch(clearError());
    navigate('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo} onPress={() => navigate(homePath)}>infopadd</Text>
        <Text style={styles.tagline}>Join the Social Wikipedia</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Beware, O Ye Wanderer! For Only The Intelligent Are Allowed Here!</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton]} 
            onPress={handleGoogleRegister}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.orText}>OR</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
          />

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleEmailRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={navigateToLogin}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    justifyContent: 'center',
    padding: theme.spacing.xl,
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  logo: {
    fontSize: 36,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.fonts.regular,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  socialButtons: {
    marginBottom: theme.spacing.lg,
  },
  socialButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: theme.colors.google,
  },
  facebookButton: {
    backgroundColor: theme.colors.facebook,
  },
  socialButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  orText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.sm,
    marginVertical: theme.spacing.lg,
    letterSpacing: 2,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    fontFamily: theme.fonts.regular,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  registerButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
  },
  loginTextBold: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
