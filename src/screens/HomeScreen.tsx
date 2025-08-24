import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// Note: This app uses hash-based routing, not React Navigation
import { AppDispatch, RootState } from '../store';
import { fetchFeedEntries } from '../store/slices/entriesSlice';
import { fetchRecentArticles, fetchPopularArticles, fetchPopularArticlesLast24h } from '../store/slices/articlesSlice';
import { fetchLeaderboard } from '../store/slices/usersSlice';
import { theme } from '../styles/theme';
import { HistoryIcon, CommentsIcon } from '../components/icons';
import { navigate, articlePathBySlug, profilePathBySlug, profilePathById } from '../utils/navigation';
import { usersService } from '../services/users';

// Import components
import { NavigationSidebar } from '../components/NavigationSidebar';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { LoginWidget } from '../components/LoginWidget';
import { ArticleCard } from '../components/ArticleCard';
import { Leaderboard } from '../components/Leaderboard';
import { CreateArticleModal } from '../components/CreateArticleModal';
import { openModal } from '../store/slices/uiSlice';
import { MobileTopNav } from '../components/MobileTopNav';

export const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { feedEntries, isLoading: entriesLoading } = useSelector((state: RootState) => state.entries);
  const { recentArticles, popularArticles24h, popularCounts24h } = useSelector((state: RootState) => state.articles);
  const { isMobile, isTablet, isNavigationExpanded, activeNavItem } = useSelector((state: RootState) => state.ui);

  // Slide-in animation for card when switching left nav filters
  const slideX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    slideX.setValue(-12);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeNavItem, slideX]);

  useEffect(() => {
    // Fetch data on component mount
    dispatch(fetchFeedEntries({ limit: 8 }));
    dispatch(fetchRecentArticles(10));
    dispatch(fetchPopularArticles(10));
    dispatch(fetchPopularArticlesLast24h(10));
    dispatch(fetchLeaderboard({ period: 'recent_creators', limit: 7 }));
  }, [dispatch]);

  const handleUserPress = async (userId: string, userSlug?: string) => {
    let slug = userSlug;
    if (!slug) {
      try {
        const user = await usersService.getUserById(userId);
        slug = user.slug || await usersService.ensureUserSlug(user.id, user.displayName || 'user');
      } catch {}
    }
    navigate(slug ? profilePathBySlug(slug) : profilePathById(userId));
  };

  if (isMobile) {
    // Mobile layout - single column
    return (
      <View style={styles.container}>
        <ScrollView style={styles.mobileContainer} contentContainerStyle={styles.mobileContent}>
          <MobileTopNav />

          <View style={styles.mobileSection}>
            <LoginWidget />
          </View>

          <View style={[styles.recentEntriesContainer, styles.mobileSection] }>
            <Text style={styles.sectionTitle}>
              {activeNavItem === 'popular' ? 'Popular (last 24h)' : 'Most Recent Entries'}
            </Text>
            <View style={styles.entriesListMobile}>
              {(activeNavItem === 'popular' ? popularArticles24h : recentArticles).slice(0, 6).map((article) => (
                <View key={article.id} style={styles.entryItem}>
                  <Text
                    style={styles.entryTitle}
                    numberOfLines={2}
                    onPress={() => navigate(articlePathBySlug(article.slug))}
                  >
                    {article.title}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: activeNavItem === 'popular' ? theme.colors.accent : theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.countBadgeText}>
                      {activeNavItem === 'popular'
                        ? (popularCounts24h[article.id] ?? 0)
                        : (article?.stats?.entries ?? 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.feedContainer}>
            {entriesLoading ? (
              <Text style={styles.loadingText}>Loading entries...</Text>
            ) : (
              feedEntries.map((entry) => (
                <ArticleCard key={entry.id} entry={entry} />
              ))
            )}
          </View>

          <View style={styles.mobileSection}>
            <Leaderboard onUserPress={handleUserPress} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Desktop/tablet layout - three columns
  return (
    <View style={styles.container}>
      <NavigationSidebar />
      
      <View style={[styles.mainContent, isNavigationExpanded && styles.mainContentExpanded]}>
        {/* Left column */}
          <View style={[styles.leftColumn, isTablet && styles.leftColumnTablet]}>
            <View style={[styles.recentEntriesWrapper, { marginTop: theme.spacing.sm }]}>
              <Animated.View
                style={[
                  styles.recentEntriesContainer,
                  styles.recentEntriesFromNav,
                  { transform: [{ translateX: slideX }] },
                ]}
              >
                {/* Pointer notch with subtle glow */}
                <View style={styles.pointerGlow} />
                <View style={styles.pointer} />
                <View style={styles.pointerBaseMask} />
                <Text style={styles.sectionTitle}>
                  {activeNavItem === 'popular' ? 'Popular (last 24h)' : 'Most Recent Entries'}
                </Text>
                <ScrollView style={styles.entriesList}>
                  {(activeNavItem === 'popular' ? popularArticles24h : recentArticles).map((article) => (
                    <View key={article.id} style={styles.entryItem}>
                      <Text
                        style={styles.entryTitle}
                        numberOfLines={2}
                        onPress={() => navigate(articlePathBySlug(article.slug))}
                      >
                        {article.title}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: activeNavItem === 'popular' ? theme.colors.accent : theme.colors.primary },
                        ]}
                      >
                        <Text style={styles.countBadgeText}>
                          {activeNavItem === 'popular'
                            ? (popularCounts24h[article.id] ?? 0)
                            : (article?.stats?.entries ?? 0)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            </View>
          </View>

        {/* Center column */}
        <View style={[styles.centerColumn, isTablet && styles.centerColumnTablet]}>
          <SearchBar showSlogan={true} />
          <SearchResults />
          
          
          <View style={styles.feedContainer}>
            {entriesLoading ? (
              <Text style={styles.loadingText}>Loading entries...</Text>
            ) : (
              feedEntries.map((entry) => (
                <ArticleCard key={entry.id} entry={entry} />
              ))
            )}
          </View>
        </View>

        {/* Right column */}
        {!isTablet && (
          <View style={styles.rightColumn}>
            <LoginWidget />
            <Leaderboard onUserPress={handleUserPress} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mobileContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  mobileContent: {
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  mobileSection: {
    marginTop: theme.spacing.sm,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: theme.layout.navigationWidth + theme.spacing.xxxl,
    paddingRight: theme.spacing.xxxl,
    paddingTop: theme.spacing.xxxl,
    maxWidth: 1600,
  },
  mainContentExpanded: {
    marginLeft: theme.layout.navigationExpandedWidth + theme.spacing.xxxl,
  },
  leftColumn: {
    flex: 21,
    paddingRight: theme.spacing.xl,
  },
  leftColumnTablet: {
    display: 'none', // Hide on tablet
  },
  centerColumn: {
    flex: 58,
    paddingHorizontal: theme.spacing.xl,
  },
  centerColumnTablet: {
    flex: 73,
  },
  rightColumn: {
    flex: 21,
    paddingLeft: theme.spacing.xl,
    paddingTop: 0,
  },
  recentEntriesWrapper: {
    position: 'relative',
    // Bring the card very close to the nav so the notch nearly touches
    paddingLeft: 2,
  },
  recentEntriesContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  // Visual connection to the left navigation
  recentEntriesFromNav: {
    transform: [{ translateX: -8 }],
    opacity: 0.98,
  },
  recentEntriesFromNavActive: {
    transform: [{ translateX: 0 }],
    opacity: 1,
  },
  navAnchor: {
    position: 'absolute',
    left: -18,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
    zIndex: 2,
    ...theme.shadows.sm,
  },
  navAnchorConnector: {
    position: 'absolute',
    // small rounded tab connecting the anchor to the card edge
    left: 10,
    top: 20,
    width: 12,
    height: 10,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 1,
  },
  navAnchorLatest: {
    backgroundColor: theme.colors.primary,
  },
  navAnchorPopular: {
    backgroundColor: theme.colors.accent,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'left',
  },
  // Speech-bubble notch connecting the card to the sidebar (triangular)
  pointerBorder: {
    position: 'absolute',
    width: 0,
    height: 0,
    left: -20,
    top: 54,
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderRightWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: theme.colors.borderLight,
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    left: -19,
    top: 55,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderRightWidth: 19,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: theme.colors.cardBackground,
  },
  // Soft halo behind the pointer to mimic the card shadow continuation
  pointerGlow: {
    position: 'absolute',
    width: 0,
    height: 0,
    left: -22,
    top: 53,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderRightWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    // Subtle colored glow to match the UI primary blue
    borderRightColor: 'rgba(47, 111, 237, 0.18)',
  },
  // Covers the card's left border where the triangle joins so it feels seamless
  pointerBaseMask: {
    position: 'absolute',
    left: -1,
    top: 54,
    width: 3,
    height: 34,
    backgroundColor: theme.colors.cardBackground,
    zIndex: 3,
  },
  leftEdge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: theme.borderRadius.xl,
  },
  entriesList: {
    maxHeight: 360,
  },
  entriesListMobile: {
    // Unbounded height for mobile recent list
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xs,
  },
  entryNumber: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  entryTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
    flexShrink: 1,
    overflow: 'hidden',
    minWidth: 0,
  },
  countBadge: {
    minWidth: 32,
    height: 26,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  countBadgeText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
  },
  mobileLoginContainer: {
    marginBottom: theme.spacing.lg,
  },
  feedContainer: {
    flex: 1,
    marginTop: theme.spacing.xl,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    marginTop: theme.spacing.xl,
  },
});
