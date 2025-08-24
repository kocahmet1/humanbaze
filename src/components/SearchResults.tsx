import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { searchArticles } from '../store/slices/articlesSlice';
import { searchUsers } from '../store/slices/usersSlice';
import { setSearchResultsVisible } from '../store/slices/uiSlice';
import { theme } from '../styles/theme';
import { navigate, articlePathBySlug, profilePathBySlug, profilePathById } from '../utils/navigation';

// Debounce helper to avoid firing search on every keystroke immediately
const useDebouncedValue = (value: string, delayMs: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
};

export const SearchResults: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchQuery, searchResults } = useSelector((s: RootState) => s.ui);
  const { articles } = useSelector((s: RootState) => s.articles);
  const { searchResults: userResults } = useSelector((s: RootState) => s.users);

  const debouncedQuery = useDebouncedValue(searchQuery, 250);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) return;
      setIsLoading(true);
      try {
        await Promise.all([
          dispatch(searchArticles({ query: debouncedQuery })),
          dispatch(searchUsers(debouncedQuery)),
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [debouncedQuery, dispatch]);

  const hasResults = useMemo(() => (articles?.length || 0) + (userResults?.length || 0) > 0, [articles, userResults]);

  // Only show the dropdown when we actually have results to display
  if (!searchResults.isVisible || !hasResults) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ScrollView style={{ maxHeight: 360 }}>

          {articles && articles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Articles</Text>
              {articles.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.item}
                  onPress={() => {
                    dispatch(setSearchResultsVisible(false));
                    navigate(articlePathBySlug(a.slug));
                  }}
                >
                  <Text numberOfLines={2} style={styles.itemTitle}>{a.title}</Text>
                  <Text style={styles.itemMeta}>{a.category} · {a?.stats?.entries ?? 0} entries</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {userResults && userResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              {userResults.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.item}
                  onPress={async () => {
                    dispatch(setSearchResultsVisible(false));
                    let slug = u.slug;
                    if (!slug) {
                      try {
                        const mod = await import('../services/users');
                        // @ts-ignore dynamic import type
                        slug = await mod.usersService.ensureUserSlug(u.id, u.displayName || 'user');
                      } catch {}
                    }
                    navigate(slug ? profilePathBySlug(slug) : profilePathById(u.id));
                  }}
                >
                  <Text numberOfLines={1} style={styles.itemTitle}>{u.displayName}</Text>
                  <Text style={styles.itemMeta}>{u.stats.followers} followers</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.close} onPress={() => dispatch(setSearchResultsVisible(false))}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  container: {
    marginTop: theme.spacing.xl,
    alignSelf: 'center',
    width: '60%',
    maxWidth: 720,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  empty: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.fonts.weights.semibold,
  },
  item: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.sm,
  },
  itemMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.xs,
    marginTop: 2,
  },
  close: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  closeText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
});


