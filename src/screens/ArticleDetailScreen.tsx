import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// Note: This app uses hash-based routing, not React Navigation
import { theme } from '../styles/theme';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from '../store';

import { Article } from '../types';
import { fetchArticleById, fetchArticleBySlug } from '../store/slices/articlesSlice';
import { fetchEntriesByArticleId } from '../store/slices/entriesSlice';
import { ArticleHeader } from '../components/article/ArticleHeader';
import { MediaCarousel } from '../components/article/MediaCarousel';
import { EntryComposer } from '../components/article/EntryComposer';
import { EntryItem } from '../components/article/EntryItem';
import { NavigationSidebar } from '../components/NavigationSidebar';
import { SearchBar } from '../components/SearchBar';
import { LoginWidget } from '../components/LoginWidget';
import { Leaderboard } from '../components/Leaderboard';
import { fetchRecentArticles, fetchPopularArticlesLast24h } from '../store/slices/articlesSlice';
import { SearchResults } from '../components/SearchResults';
import { navigate, articlePathBySlug, profilePathBySlug, profilePathById } from '../utils/navigation';
import { usersService } from '../services/users';

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const ArticleDetailScreen: React.FC<{ articleId?: string; articleSlug?: string }> = ({ articleId, articleSlug }) => {
  const dispatch = useDispatch<AppDispatch>();
  const articlesState = useAppSelector((state) => state.articles);
  const entriesState = useAppSelector((state) => state.entries);
  const authState = useAppSelector((state) => state.auth);
  const uiState = useAppSelector((state) => state.ui);
  
  const { currentArticle, isLoading, recentArticles, popularArticles24h, popularCounts24h } = articlesState as any;
  const { entries } = entriesState as any;
  const { user } = authState as any;
  const { isMobile, isTablet, isNavigationExpanded, activeNavItem } = uiState as any;

  useEffect(() => {
    if (articleSlug) {
      // Load by slug then entries by the resolved id once available
      dispatch(fetchArticleBySlug(articleSlug));
    } else if (articleId) {
      dispatch(fetchArticleById(articleId));
      dispatch(fetchEntriesByArticleId({ articleId, limit: 20 }));
    }
    dispatch(fetchRecentArticles(10));
    dispatch(fetchPopularArticlesLast24h(10));
  }, [dispatch, articleId]);

  // When loading by slug, wait for currentArticle.id to fetch entries
  useEffect(() => {
    if (articleSlug && currentArticle?.id) {
      dispatch(fetchEntriesByArticleId({ articleId: currentArticle.id, limit: 20 }));
    }
  }, [dispatch, articleSlug, currentArticle?.id]);

  const handleUserPress = async (userId: string) => {
    try {
      const user = await usersService.getUserById(userId);
      const slug = user.slug || await usersService.ensureUserSlug(user.id, user.displayName || 'user');
      navigate(slug ? profilePathBySlug(slug) : profilePathById(userId));
    } catch {
      navigate(profilePathById(userId));
    }
  };
  if (isMobile) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: theme.spacing.lg }}>
        {currentArticle && (
          <>
            <ArticleHeader article={currentArticle} entryCount={entries.length} />
            <MediaCarousel entries={entries} />
          </>
        )}
        <EntryComposer articleId={articleId} />
        {/* Mobile: show user actions including New Title */}
        <View style={styles.section}>
          <LoginWidget />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entries</Text>
          {entries.length === 0 ? (
            <Text style={styles.empty}>No entries yet. Phase 3 will add posting.</Text>
          ) : (
            entries.map((e: any, index: number) => (
              <EntryItem key={e.id} entry={e} currentUserId={user?.id} entryNumber={index + 1} />
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.page}>
      <NavigationSidebar />
      <View style={[styles.mainContent, isNavigationExpanded && styles.mainContentExpanded]}>
        {/* Left column - most recent */}
        <View style={[styles.leftColumn, isTablet && styles.leftColumnTablet]}>
          <View style={[styles.recentEntriesContainer, { marginTop: theme.spacing.md }] }>
            <Text style={styles.sectionTitleCenter}>{activeNavItem === 'popular' ? 'Popular (last 24h)' : 'Most Recent Entries'}</Text>
            <ScrollView style={styles.entriesList}>
              {(activeNavItem === 'popular' ? popularArticles24h : recentArticles).map((article: Article) => (
                <View key={article.id} style={styles.recentEntryItem}>
                  <Text
                    style={styles.entryTitle}
                    numberOfLines={2}
                    onPress={() => navigate(articlePathBySlug(article.slug))}
                  >
                    {article.title}
                  </Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {activeNavItem === 'popular' ? (popularCounts24h?.[article.id] ?? 0) : (article?.stats?.entries ?? 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Center column - article */}
        <View style={[styles.centerColumn, isTablet && styles.centerColumnTablet]}>
          {/* Header with search */}
          <View style={styles.pageHeader}>
            <View style={styles.searchContainer}>
              <SearchBar />
            </View>
          </View>
          <SearchResults />
          
          {/* Main content area */}
          <View style={styles.contentWrapper}>
            {currentArticle && (
              <>
                <ArticleHeader article={currentArticle} entryCount={entries.length} />
                <MediaCarousel entries={entries} />
                
                {/* Entry composer section */}
                <View style={styles.composerSection}>
                  <EntryComposer articleId={articleId} />
                </View>
                
                {/* Entries section with improved header */}
                <View style={styles.entriesSection}>
                  <View style={styles.entriesHeader}>
                    <Text style={styles.entriesTitle}>Entries</Text>
                    <View style={styles.entriesCount}>
                      <Text style={styles.entriesCountText}>{entries.length}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.entriesListContainer}>
                    {entries.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No entries yet</Text>
                        <Text style={styles.emptyStateSubtext}>Be the first to share your thoughts!</Text>
                      </View>
                    ) : (
                      entries.map((e: any, index: number) => (
                        <EntryItem key={e.id} entry={e} currentUserId={user?.id} entryNumber={index + 1} />
                      ))
                    )}
                  </View>
                </View>
              </>
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  back: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.sm,
  },
  title: { fontSize: theme.fonts.sizes.xxxl, fontWeight: theme.fonts.weights.bold as any, color: theme.colors.text },
  description: { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  section: { marginTop: theme.spacing.md },
  sectionTitle: { fontWeight: theme.fonts.weights.semibold as any, color: theme.colors.text, marginBottom: theme.spacing.md },
  empty: { color: theme.colors.textSecondary },
  entryItem: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  entryText: { color: theme.colors.text }
  ,
  page: { flex: 1, backgroundColor: theme.colors.background },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: (theme as any).layout?.navigationWidth + theme.spacing.xl || 260 + theme.spacing.xl,
    paddingRight: theme.spacing.lg,
    maxWidth: 1480,
    transition: 'margin-left 0.3s ease-in-out',
  },
  mainContentExpanded: {
    marginLeft: theme.layout.navigationExpandedWidth + theme.spacing.xl,
  },
  leftColumn: { width: (theme as any).layout?.leftColumnWidth || 240, paddingRight: theme.spacing.md },
  leftColumnTablet: { display: 'none' as any },
  centerColumn: { width: (theme as any).layout?.centerColumnWidth || 580, paddingHorizontal: theme.spacing.md },
  centerColumnTablet: { width: (theme as any).layout?.tabletCenterWidth || 680 },
  rightColumn: { width: (theme as any).layout?.rightColumnWidth || 280, paddingLeft: theme.spacing.md, paddingTop: theme.spacing.sm },
  logoContainer: { alignItems: 'center', marginTop: theme.spacing.xxxl, marginBottom: theme.spacing.md },
  logo: { fontSize: 24, fontWeight: theme.fonts.weights.bold as any, color: theme.colors.primary, fontFamily: theme.fonts.regular },
  recentEntriesContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.borderLight}`,
  },
  entriesList: { maxHeight: 360 },
  sectionTitleCenter: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold as any,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing.lg,
    textAlign: 'left',
  },
  recentEntryItem: {
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
  entryNumber: { width: 24, height: 24, backgroundColor: theme.colors.overlay, borderRadius: theme.borderRadius.full, textAlign: 'center', lineHeight: 24 as any, fontSize: theme.fonts.sizes.xs, color: theme.colors.text, marginRight: theme.spacing.sm },
  entryTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: theme.fonts.weights.medium as any,
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
  countBadgeText: { color: theme.colors.surface, fontSize: theme.fonts.sizes.xs, fontWeight: theme.fonts.weights.semibold as any },
  
  // New header styles
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  // removed back button styles
  searchContainer: {
    flex: 1,
  },
  
  // Content wrapper
  contentWrapper: {
    flex: 1,
  },
  
  // Entry composer section
  composerSection: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  
  // Entries section
  entriesSection: {
    marginTop: theme.spacing.xs,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  entriesTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold as any,
    color: theme.colors.text,
  },
  entriesCount: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  entriesCountText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  entriesListContainer: {
    marginTop: theme.spacing.xs,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.md,
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium as any,
    marginBottom: theme.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
  },
});
