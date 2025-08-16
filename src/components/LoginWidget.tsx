import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { openModal } from '../store/slices/uiSlice';
import { theme } from '../styles/theme';

export const LoginWidget: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCreateTitle = () => {
    dispatch(openModal('createArticle'));
  };

  const handleOpenSettings = () => {
    // Use hash navigation for web like Admin button below
    window.location.hash = '#/settings';
  };

  // If not logged in, render a compact sign-in card (used in the right sidebar)
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loginHeader}>
          <Text style={styles.loginTitle}>Welcome to Humanbaze</Text>
          <Text style={styles.loginSubtitle}>Sign in to join the conversation</Text>
        </View>
        <View style={styles.loginActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => dispatch(openModal('login'))}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => dispatch(openModal('register'))}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If user is logged in, show user info
  {
    return (
      <View style={styles.container}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Posts</Text>
                <Text style={styles.statValue}>{user.stats.entries}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statValue}>{user.stats.points}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Following</Text>
                <Text style={styles.statValue}>{user.stats.following}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateTitle}>
            <Text style={styles.actionButtonText}>New Title</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenSettings}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          {user.email?.toLowerCase() === 'ahmetkoc1@gmail.com' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (window.location.hash = '#/admin')}
            >
              <Text style={styles.actionButtonText}>Admin</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
    marginBottom: theme.spacing.xl,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.borderLight}`,
  },
  loginHeader: {
    marginBottom: theme.spacing.lg,
  },
  loginTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  loginActions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      ...theme.shadows.md,
    },
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    transition: `color ${theme.animations.fast} ${theme.animations.ease}`,
    '&:hover': {
      color: theme.colors.primary,
    },
  },
  loginForm: {
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    fontFamily: theme.fonts.regular,
    fontWeight: theme.fonts.weights.medium as any,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    outlineStyle: 'none' as any,
    '&:focus': {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    '::placeholder': {
      color: theme.colors.textMuted,
    },
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.md,
  },
  userAvatarText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  userActions: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.borderLight,
      transform: 'translateY(-1px)',
    },
  },
  actionButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
  },
  logoutButton: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxxl,
    margin: theme.spacing.lg,
    minWidth: 300,
    maxWidth: 400,
    ...theme.shadows.lg,
    border: `1px solid ${theme.colors.borderLight}`,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
});
