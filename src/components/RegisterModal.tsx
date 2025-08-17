import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { closeModal, openModal } from '../store/slices/uiSlice';
import { registerWithEmail, loginWithGoogle } from '../store/slices/authSlice';
import { theme } from '../styles/theme';

export const RegisterModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { modals } = useSelector((s: RootState) => s.ui);
  const { isLoading } = useSelector((s: RootState) => s.auth);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!modals.register) return null;

  const onClose = () => dispatch(closeModal('register'));

  const handleEmailRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password || password.length < 6 || password !== confirmPassword) {
      Alert.alert('Error', 'Please fill all fields correctly. Password must be at least 6 characters and match.');
      return;
    }
    try {
      await dispatch(registerWithEmail({ email, password, displayName: displayName.trim() })).unwrap();
      onClose();
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Failed to create account');
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Infopadd</Text>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[styles.socialButton, styles.googleButton]} 
            onPress={async () => {
              try {
                await dispatch(loginWithGoogle()).unwrap();
                onClose();
              } catch (e: any) {
                Alert.alert('Registration Failed', e.message || 'Failed with Google');
              }
            }}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.orText}>OR</Text>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Full Name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
          <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailRegister} disabled={isLoading}>
            <Text style={styles.primaryBtnText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { onClose(); dispatch(openModal('login')); }}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Sign In</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: theme.zIndex.modal,
    padding: theme.spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  socialButtons: { marginBottom: theme.spacing.lg },
  socialButton: { padding: theme.spacing.md, borderRadius: theme.borderRadius.full, marginBottom: theme.spacing.md, alignItems: 'center' },
  googleButton: { backgroundColor: theme.colors.google },
  facebookButton: { backgroundColor: theme.colors.facebook },
  socialButtonText: { color: theme.colors.surface, fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.medium },
  orText: { textAlign: 'center', color: theme.colors.textLight, fontSize: theme.fonts.sizes.sm, marginVertical: theme.spacing.md, letterSpacing: 2 },
  inputContainer: { marginBottom: theme.spacing.lg },
  input: { backgroundColor: theme.colors.overlay, borderRadius: theme.borderRadius.full, padding: theme.spacing.md, marginBottom: theme.spacing.md, fontSize: theme.fonts.sizes.md, fontFamily: theme.fonts.regular },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.sm },
  primaryBtnText: { color: theme.colors.surface, fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold },
  switchText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  switchTextBold: { color: theme.colors.primary, fontWeight: theme.fonts.weights.semibold },
  cancelText: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: theme.spacing.md },
});


