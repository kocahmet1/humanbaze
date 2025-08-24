import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
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
import { navigate, homePath } from '../utils/navigation';

const NAV_COLORS = {
  background: '#0B0D12',
  border: '#141A22',
  blue: '#2F6FED',
  blueHover: '#3B82F6',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255,255,255,0.85)',
  iconInactiveBg: 'rgba(255,255,255,0.06)',
};

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
    <View style={[
      styles.container,
      isNavigationExpanded && styles.expanded,
      Platform.OS === 'web' && styles.webFixed,
    ]}>
      {/* Logo / Brand */}
      <TouchableOpacity
        style={[styles.logoContainer, isNavigationExpanded && styles.logoContainerExpanded]}
        onPress={() => navigate(homePath)}
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
          <View style={[styles.iconWrapper, activeNavItem === 'latest' && styles.iconWrapperActive]}>
            <HistoryIcon color={NAV_COLORS.white} size={20} />
          </View>
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
          <View style={[styles.iconWrapper, activeNavItem === 'popular' && styles.iconWrapperActive]}>
            <CommentsIcon color={NAV_COLORS.white} size={20} />
          </View>
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
            <View style={[styles.iconWrapper, activeNavItem === 'following' && styles.iconWrapperActive]}>
              <UsersIcon color={NAV_COLORS.white} size={20} />
            </View>
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
          <View style={[styles.iconWrapper, activeNavItem === 'channels' && styles.iconWrapperActive]}>
            <TagIcon color={NAV_COLORS.white} size={20} />
          </View>
          {isNavigationExpanded && (
            <Text style={[styles.navText, activeNavItem === 'channels' && styles.navTextActive]}>
              channels
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Expand Toggle */}
      <TouchableOpacity style={styles.expandButton} onPress={handleExpandToggle}>
        <MenuIcon color={NAV_COLORS.white} size={16} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: theme.layout.navigationWidth,
    backgroundColor: NAV_COLORS.background,
    zIndex: theme.zIndex.navigation,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: NAV_COLORS.border,
    ...theme.shadows.sm,
  },
  // Web-only: keep sidebar pinned to viewport
  webFixed: {
    // Type cast to bypass RN types that don't include 'fixed'
    position: 'fixed' as any,
  },
  expanded: {
    width: theme.layout.navigationExpandedWidth,
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
  },
  logoContainer: {
    width: 45,
    height: 45,
    backgroundColor: NAV_COLORS.blue,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.sm,
    ...theme.shadows.md,
  },
  logoContainerExpanded: {
    width: '90%',
    height: 45,
    alignItems: 'flex-start',
    borderRadius: theme.borderRadius.xl,
  },
  logoText: {
    color: NAV_COLORS.white,
    fontSize: 22,
    fontWeight: theme.fonts.weights.black,
  },
  brandText: {
    color: NAV_COLORS.white,
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
  },
  navItemActive: {
    backgroundColor: 'rgba(47, 111, 237, 0.14)',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAV_COLORS.iconInactiveBg,
  },
  iconWrapperActive: {
    backgroundColor: NAV_COLORS.blue,
  },
  navText: {
    color: NAV_COLORS.whiteMuted,
    fontSize: theme.fonts.sizes.md,
    marginLeft: theme.spacing.md,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
  },
  navTextActive: {
    color: NAV_COLORS.white,
    fontWeight: theme.fonts.weights.semibold,
  },
  expandButton: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: NAV_COLORS.iconInactiveBg,
    borderWidth: 1,
    borderColor: NAV_COLORS.border,
    marginTop: 'auto',
    marginBottom: theme.spacing.md,
  },
});
