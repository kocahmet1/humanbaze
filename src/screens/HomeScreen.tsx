import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// Note: This app uses hash-based routing, not React Navigation
import { AppDispatch, RootState } from '../store';
import { fetchFeedEntries } from '../store/slices/entriesSlice';
import { fetchRecentArticles, fetchPopularArticles, fetchPopularArticlesLast24h } from '../store/slices/articlesSlice';
import { fetchLeaderboard } from '../store/slices/usersSlice';
import { theme } from '../styles/theme';

// Import components
import { NavigationSidebar } from '../components/NavigationSidebar';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { LoginWidget } from '../components/LoginWidget';
import { ArticleCard } from '../components/ArticleCard';
import { Leaderboard } from '../components/Leaderboard';
import { CreateArticleModal } from '../components/CreateArticleModal';
import { openModal } from '../store/slices/uiSlice';


export const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { feedEntries, isLoading: entriesLoading } = useSelector((state: RootState) => state.entries);
  const { recentArticles, popularArticles24h, popularCounts24h } = useSelector((state: RootState) => state.articles);
  const { isMobile, isTablet, isNavigationExpanded, activeNavItem } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    // Fetch data on component mount
    dispatch(fetchFeedEntries({ limit: 8 }));
    dispatch(fetchRecentArticles(10));
    dispatch(fetchPopularArticles(10));
    dispatch(fetchPopularArticlesLast24h(10));
    dispatch(fetchLeaderboard({ period: 'recent_creators', limit: 7 }));
  }, [dispatch]);

  const handleUserPress = (userId: string) => {
    // Navigate using hash-based routing
    window.location.hash = `#/profile/${userId}`;
  };

  if (isMobile) {
    // Mobile layout - single column
    return (
      <View style={styles.container}>
        <ScrollView style={styles.mobileContainer}>
          <SearchBar />
          <SearchResults />
          <LoginWidget />
          
          <View style={styles.feedContainer}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            {feedEntries.map((entry) => (
              <ArticleCard key={entry.id} entry={entry} />
            ))}
          </View>
          
          <Leaderboard onUserPress={handleUserPress} />
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
            <View style={[styles.recentEntriesContainer, { marginTop: theme.spacing.sm }] }>
              <Text style={styles.sectionTitle}>
                {activeNavItem === 'popular' ? 'Popular (last 24h)' : 'Most Recent Entries'}
              </Text>
              <ScrollView style={styles.entriesList}>
                {(activeNavItem === 'popular' ? popularArticles24h : recentArticles).map((article) => (
                  <View key={article.id} style={styles.entryItem}>
                    <Text
                      style={styles.entryTitle}
                      numberOfLines={2}
                      onPress={() => (window.location.hash = `#/article/${encodeURIComponent(article.id)}`)}
                    >
                      {article.title}
                    </Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {activeNavItem === 'popular'
                          ? (popularCounts24h[article.id] ?? 0)
                          : (article?.stats?.entries ?? 0)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
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
      <CreateArticleModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    minHeight: '100vh',
  },
  mobileContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: theme.layout.navigationWidth + theme.spacing.xxxl,
    paddingRight: theme.spacing.xxxl,
    paddingTop: theme.spacing.xxxl,
    maxWidth: 1600,
    transition: `margin-left ${theme.animations.normal} ${theme.animations.ease}`,
  },
  mainContentExpanded: {
    marginLeft: theme.layout.navigationExpandedWidth + theme.spacing.xxxl,
  },
  leftColumn: {
    width: theme.layout.leftColumnWidth,
    paddingRight: theme.spacing.xl,
  },
  leftColumnTablet: {
    display: 'none', // Hide on tablet
  },
  centerColumn: {
    width: theme.layout.centerColumnWidth,
    paddingHorizontal: theme.spacing.xl,
  },
  centerColumnTablet: {
    width: theme.layout.tabletCenterWidth,
  },
  rightColumn: {
    width: theme.layout.rightColumnWidth,
    paddingLeft: theme.spacing.xl,
    paddingTop: 0,
  },
  recentEntriesContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.borderLight}`,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing.lg,
    textAlign: 'left',
  },
  entriesList: {
    maxHeight: 360,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xs,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.overlay,
    },
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
    fontWeight: theme.fonts.weights.medium,
    transition: `color ${theme.animations.fast} ${theme.animations.ease}`,
    flexShrink: 1,
    overflow: 'hidden',
    minWidth: 0,
    '&:hover': {
      color: theme.colors.primary,
    },
  },
  countBadge: {
    minWidth: 32,
    height: 26,
    paddingHorizontal: 10,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  countBadgeText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
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
