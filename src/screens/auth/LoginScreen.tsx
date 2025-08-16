import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loginWithEmail, loginWithGoogle, loginWithFacebook, clearError } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, user } = useSelector((state: RootState) => state.auth);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await dispatch(loginWithEmail({ email, password })).unwrap();
      // Navigate to home after successful login
      window.location.hash = '#/';
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Failed to login');
    }
  };

  // If user becomes authenticated (e.g., via social login), redirect to home
  useEffect(() => {
    if (user) {
      window.location.hash = '#/';
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Failed to login with Google');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await dispatch(loginWithFacebook()).unwrap();
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Failed to login with Facebook');
    }
  };

  const navigateToRegister = () => {
    dispatch(clearError());
    window.location.hash = '#/register';
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo} onPress={() => (window.location.hash = '#/')}>infopadd</Text>
        <Text style={styles.tagline}>The Social Wikipedia</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton]} 
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, styles.facebookButton]} 
            onPress={handleFacebookLogin}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>OR</Text>

        <View style={styles.inputContainer}>
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

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerLink} onPress={navigateToRegister}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: theme.spacing.xl,
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
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
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
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
  },
  registerTextBold: {
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
