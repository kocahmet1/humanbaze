import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setActiveNavItem } from '../store/slices/uiSlice';
import { theme } from '../styles/theme';
import { HistoryIcon, CommentsIcon, UsersIcon, TagIcon } from './icons';

export const MobileTopNav: React.FC = () => {
  const dispatch = useDispatch();
  const { activeNavItem } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const Item: React.FC<{
    id: 'latest' | 'popular' | 'following' | 'channels';
    label: string;
    icon: React.ReactNode;
    hidden?: boolean;
  }> = ({ id, label, icon, hidden }) => {
    if (hidden) return null;
    const active = activeNavItem === id;
    return (
      <TouchableOpacity
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => dispatch(setActiveNavItem(id))}
        activeOpacity={0.8}
      >
        <View style={styles.icon}>{icon}</View>
        <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Item id="latest" label="latest" icon={<HistoryIcon color={theme.colors.navText} size={18} />} />
      <Item id="popular" label="popular" icon={<CommentsIcon color={theme.colors.navText} size={18} />} />
      <Item id="following" label="following" icon={<UsersIcon color={theme.colors.navText} size={18} />} hidden={!user} />
      <Item id="channels" label="channels" icon={<TagIcon color={theme.colors.navText} size={18} />} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.navBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
    position: 'sticky' as any,
    top: theme.spacing.sm,
    zIndex: theme.zIndex.navigation,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    ...theme.shadows.sm,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  navText: {
    color: theme.colors.navText,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
  navTextActive: {
    color: theme.colors.surface,
  },
});
