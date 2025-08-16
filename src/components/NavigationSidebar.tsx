import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setActiveNavItem, toggleNavigation } from '../store/slices/uiSlice';
import { theme } from '../styles/theme';
import { 
  HistoryIcon, 
  CommentsIcon, 
  UsersIcon, 
  TagIcon,
  MenuIcon 
} from './icons';

export const NavigationSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeNavItem, isNavigationExpanded } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const handleNavItemPress = (item: typeof activeNavItem) => {
    dispatch(setActiveNavItem(item));
  };

  const handleExpandToggle = () => {
    dispatch(toggleNavigation());
  };

  return (
    <View style={[styles.container, isNavigationExpanded && styles.expanded]}>
      {/* Logo / Brand */}
      <TouchableOpacity
        style={[styles.logoContainer, isNavigationExpanded && styles.logoContainerExpanded]}
        onPress={() => (window.location.hash = '#/')}
        accessibilityRole="link"
      >
        {isNavigationExpanded ? (
          <Text style={styles.brandText}>humanbaze</Text>
        ) : (
          <Text style={styles.logoText}>h</Text>
        )}
      </TouchableOpacity>

      {/* Navigation Items */}
              <View style={[styles.navItems, isNavigationExpanded && styles.navItemsExpanded]}>
        <TouchableOpacity
          style={[styles.navItem, activeNavItem === 'latest' && styles.navItemActive]}
          onPress={() => handleNavItemPress('latest')}
        >
          <HistoryIcon 
            color={activeNavItem === 'latest' ? theme.colors.navTextActive : theme.colors.navText} 
            size={20} 
          />
          {isNavigationExpanded && (
            <Text style={[styles.navText, activeNavItem === 'latest' && styles.navTextActive]}>
              latest
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeNavItem === 'popular' && styles.navItemActive]}
          onPress={() => handleNavItemPress('popular')}
        >
          <CommentsIcon 
            color={activeNavItem === 'popular' ? theme.colors.navTextActive : theme.colors.navText} 
            size={20} 
          />
          {isNavigationExpanded && (
            <Text style={[styles.navText, activeNavItem === 'popular' && styles.navTextActive]}>
              popular
            </Text>
          )}
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            style={[styles.navItem, activeNavItem === 'following' && styles.navItemActive]}
            onPress={() => handleNavItemPress('following')}
          >
            <UsersIcon 
              color={activeNavItem === 'following' ? theme.colors.navTextActive : theme.colors.navText} 
              size={20} 
            />
            {isNavigationExpanded && (
              <Text style={[styles.navText, activeNavItem === 'following' && styles.navTextActive]}>
                following
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navItem, activeNavItem === 'channels' && styles.navItemActive]}
          onPress={() => handleNavItemPress('channels')}
        >
          <TagIcon 
            color={activeNavItem === 'channels' ? theme.colors.navTextActive : theme.colors.navText} 
            size={20} 
          />
          {isNavigationExpanded && (
            <Text style={[styles.navText, activeNavItem === 'channels' && styles.navTextActive]}>
              channels
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Expand Toggle */}
      <TouchableOpacity style={styles.expandButton} onPress={handleExpandToggle}>
        <MenuIcon color={theme.colors.navText} size={16} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    left: 0,
    top: 0,
    width: theme.layout.navigationWidth,
    height: '100vh',
    backgroundColor: theme.colors.navBackground,
    zIndex: theme.zIndex.navigation,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    transition: `width ${theme.animations.normal} ${theme.animations.ease}`,
    overflow: 'hidden',
    borderRight: `1px solid ${theme.colors.border}`,
    backdropFilter: 'blur(10px)',
  },
  expanded: {
    width: theme.layout.navigationExpandedWidth,
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
  },
  logoContainer: {
    width: 45,
    height: 45,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.sm,
    ...theme.shadows.md,
    transition: `all ${theme.animations.normal} ${theme.animations.ease}`,
  },
  logoContainerExpanded: {
    width: '90%',
    height: 45,
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.xl,
  },
  logoText: {
    color: theme.colors.surface,
    fontSize: 22,
    fontWeight: theme.fonts.weights.black,
  },
  brandText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: theme.fonts.weights.bold,
    letterSpacing: -0.5,
    marginLeft: theme.spacing.md,
    textTransform: 'lowercase',
  },
  navItems: {
    flex: 1,
    width: '100%',
    paddingHorizontal: theme.spacing.sm,
  },
  navItemsExpanded: {
    alignItems: 'stretch',
    paddingHorizontal: theme.spacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    position: 'relative',
    minHeight: 44,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
  },
  navItemActive: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary}15 0%, ${theme.colors.accent}15 100%)`,
    borderLeft: `3px solid ${theme.colors.primary}`,
    marginLeft: -3,
  },
  navText: {
    color: theme.colors.navText,
    fontSize: theme.fonts.sizes.md,
    marginLeft: theme.spacing.md,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    transition: `color ${theme.animations.fast} ${theme.animations.ease}`,
  },
  navTextActive: {
    color: theme.colors.navTextActive,
    fontWeight: theme.fonts.weights.semibold,
  },
  expandButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.navHover,
    marginTop: 'auto',
    marginBottom: theme.spacing.md,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
  },
});
