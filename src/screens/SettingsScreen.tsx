import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { theme } from '../styles/theme';
import { RootState } from '../store';
import { authService } from '../services/auth';
import { usersService } from '../services/users';
import { setUser } from '../store/slices/authSlice';
import { navigate, homePath } from '../utils/navigation';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!user) {
    return (
      <View style={styles.centerNotice}>
        <Text style={styles.noticeText}>Please sign in to manage your settings.</Text>
      </View>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setLoadingSection('profile');
      const updated = await authService.updateUserProfile({ displayName, bio });
      dispatch(setUser(updated));
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setLoadingSection(null);
    }
  };

  const handleSelectAvatar = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setLoadingSection('avatar');
      const result = await usersService.uploadProfilePhoto(user.id, file);
      const updated = await authService.updateUserProfile({ photoURL: result.photoURL });
      dispatch(setUser(updated));
    } catch (err: any) {
      alert(err.message || 'Failed to upload avatar');
    } finally {
      setLoadingSection(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangeEmail = async () => {
    try {
      if (!email || !currentPasswordForEmail) {
        alert('Enter new email and your current password');
        return;
      }
      setLoadingSection('email');
      const updated = await authService.updateEmailAddress(email, currentPasswordForEmail);
      dispatch(setUser(updated));
      setCurrentPasswordForEmail('');
    } catch (e: any) {
      alert(e.message || 'Failed to update email');
    } finally {
      setLoadingSection(null);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPasswordForPassword || !newPassword) {
        alert('Fill in current and new password');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match');
        return;
      }
      setLoadingSection('password');
      await authService.changePassword(currentPasswordForPassword, newPassword);
      setCurrentPasswordForPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password changed successfully');
    } catch (e: any) {
      alert(e.message || 'Failed to change password');
    } finally {
      setLoadingSection(null);
    }
  };

  const handleDeleteAccount = async () => {
    const pw = prompt('Type your current password to confirm account deletion:');
    if (!pw) return;
    try {
      setLoadingSection('delete');
      await authService.deleteAccount(pw);
      alert('Account deleted. You will be signed out.');
      navigate(homePath);
    } catch (e: any) {
      alert(e.message || 'Failed to delete account');
    } finally {
      setLoadingSection(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Display name</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Avatar</Text>
          <TouchableOpacity style={styles.button} onPress={handleSelectAvatar} disabled={loadingSection==='avatar'}>
            <Text style={styles.buttonText}>{loadingSection==='avatar' ? 'Uploading...' : 'Upload image'}</Text>
          </TouchableOpacity>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarFile}
          />
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} disabled={loadingSection==='profile'}>
          <Text style={styles.primaryButtonText}>{loadingSection==='profile' ? 'Saving...' : 'Save profile'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current password</Text>
          <TextInput style={styles.input} value={currentPasswordForEmail} onChangeText={setCurrentPasswordForEmail} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleChangeEmail} disabled={loadingSection==='email'}>
          <Text style={styles.buttonText}>{loadingSection==='email' ? 'Updating...' : 'Update email'}</Text>
        </TouchableOpacity>

        <View style={[styles.separator, { marginVertical: theme.spacing.lg }]} />

        <View style={styles.row}>
          <Text style={styles.label}>Current password</Text>
          <TextInput style={styles.input} value={currentPasswordForPassword} onChangeText={setCurrentPasswordForPassword} secureTextEntry />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>New password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loadingSection==='password'}>
          <Text style={styles.buttonText}>{loadingSection==='password' ? 'Updating...' : 'Change password'}</Text>
        </TouchableOpacity>

        <View style={[styles.separator, { marginVertical: theme.spacing.lg }]} />

        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount} disabled={loadingSection==='delete'}>
          <Text style={styles.dangerButtonText}>{loadingSection==='delete' ? 'Deleting...' : 'Delete account'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  row: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  input: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
  },
  button: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.medium as any,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.medium as any,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  dangerButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.medium as any,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
  },
  centerNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeText: {
    color: theme.colors.textSecondary,
  },
});
