import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
// Note: This app uses hash-based routing, not React Navigation
import { AppDispatch, RootState } from '../store';
import { User, Entry, Article } from '../types';
import { usersService } from '../services/users';
import { entriesService } from '../services/entries';
import { articlesService } from '../services/articles';
import { fetchRecentArticles } from '../store/slices/articlesSlice';
import { theme } from '../styles/theme';
import { EntryItem } from '../components/article/EntryItem';
import { HeartIcon, MessageCircle, UsersIconAlt, ArrowLeftIcon } from '../components/icons';
import { NavigationSidebar } from '../components/NavigationSidebar';
import { SearchBar } from '../components/SearchBar';
import { LoginWidget } from '../components/LoginWidget';
import { Leaderboard } from '../components/Leaderboard';

interface ProfileEntry extends Entry {
  article?: Article;
}

export interface UserProfileScreenProps {
  userId: string;
}

const UserProfileScreen = ({ userId }: UserProfileScreenProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { isMobile, isTablet } = useSelector((state: RootState) => state.ui) as any;
  const { recentArticles } = useSelector((state: RootState) => state.articles);
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userEntries, setUserEntries] = useState<ProfileEntry[]>([]);
  const [mostLikedEntry, setMostLikedEntry] = useState<ProfileEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadUserProfile();
    // Fetch recent articles for the left sidebar
    dispatch(fetchRecentArticles(10));
  }, [userId, dispatch]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // Load user data
      const user = await usersService.getUserById(userId);
      setProfileUser(user);
      
      // Load user entries
      const entries = await entriesService.getEntriesByUser(userId, 20);
      
      // Load articles for entries to show titles
      const entriesWithArticles = await Promise.all(
        entries.map(async (entry) => {
          try {
            const article = await articlesService.getArticleById(entry.articleId);
            return { ...entry, article };
          } catch {
            return entry;
          }
        })
      );
      
      setUserEntries(entriesWithArticles);
      
      // Get most liked entry
      const mostLikedEntries = await entriesService.getMostLikedEntriesByUser(userId, 1);
      if (mostLikedEntries.length > 0) {
        try {
          const article = await articlesService.getArticleById(mostLikedEntries[0].articleId);
          setMostLikedEntry({ ...mostLikedEntries[0], article });
        } catch {
          setMostLikedEntry(mostLikedEntries[0]);
        }
      }
      
      // Check if following (for other users)
      if (!isOwnProfile && currentUser) {
        const following = await usersService.isFollowing(currentUser.id, userId);
        setIsFollowing(following);
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser || isOwnProfile) return;
    
    try {
      if (isFollowing) {
        await usersService.unfollowUser(currentUser.id, profileUser.id);
        setIsFollowing(false);
        // Update follower count
        setProfileUser(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers - 1 }
        } : null);
      } else {
        await usersService.followUser(currentUser.id, profileUser.id);
        setIsFollowing(true);
        // Update follower count
        setProfileUser(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers + 1 }
        } : null);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderMostLikedEntry = () => {
    if (!mostLikedEntry) return null;
    
    return (
      <View style={styles.mostLikedSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.quoteIcon}>
            <Text style={styles.quoteText}>"</Text>
          </View>
          <Text style={styles.sectionTitle}>Most Liked Entry</Text>
        </View>
        
        <View style={styles.mostLikedEntry}>
          <Text style={styles.entryContent} numberOfLines={4}>
            {mostLikedEntry.content}
          </Text>
          
          {mostLikedEntry.article && (
            <Text style={styles.entryArticle}>
              from: {mostLikedEntry.article.title}
            </Text>
          )}
          
          <View style={styles.entryStats}>
            <View style={styles.statItem}>
              <HeartIcon size={14} color={theme.colors.primary} />
              <Text style={styles.statText}>{mostLikedEntry.stats.likes}</Text>
            </View>
            <Text style={styles.entryDate}>
              {new Date(mostLikedEntry.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

    if (!profileUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {isLoading ? 'Loading...' : 'Profile not found'}
        </Text>
      </View>
    );
  }

  if (isMobile) {
    // Mobile layout - single column with header
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => window.history.back()} style={styles.backButton}>
            <ArrowLeftIcon size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profileUser.displayName}</Text>
        </View>

        <ScrollView
          style={styles.mobileContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: profileUser.photoURL || 'https://via.placeholder.com/200x200?text=User'
              }}
              style={styles.avatar}
            />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{profileUser.displayName}</Text>
            {profileUser.bio && (
              <Text style={styles.bio}>{profileUser.bio}</Text>
            )}
            
            {!isOwnProfile && currentUser && (
              <View style={styles.profileActions}>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleFollow}
                >
                  <UsersIconAlt size={16} color={isFollowing ? theme.colors.textSecondary : theme.colors.surface} />
                  <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileUser.stats.entries}</Text>
            <Text style={styles.statLabel}>entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileUser.stats.points}</Text>
            <Text style={styles.statLabel}>points</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileUser.stats.followers}</Text>
            <Text style={styles.statLabel}>followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{profileUser.stats.following}</Text>
            <Text style={styles.statLabel}>following</Text>
          </View>
        </View>

        {/* Most Liked Entry */}
        {renderMostLikedEntry()}

        {/* Recent Entries */}
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {userEntries.length > 0 ? (
            userEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <EntryItem
                  entry={entry}
                  article={entry.article}
                  showActions={false}
                />
              </View>
            ))
          ) : (
            <Text style={styles.noEntriesText}>No entries yet</Text>
          )}
        </View>
        </ScrollView>
      </View>
    );
  }

  // Desktop/tablet layout - three columns
  return (
    <View style={styles.container}>
      <NavigationSidebar />
      
      <View style={styles.mainContent}>
        {/* Left column */}
        <View style={[styles.leftColumn, isTablet && styles.leftColumnTablet]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo} onPress={() => (window.location.hash = '#/')}>infopadd</Text>
          </View>
          
          <View style={styles.recentEntriesContainer}>
            <Text style={styles.sectionTitle}>Most Recent Entries</Text>
            <ScrollView style={styles.entriesList}>
              {recentArticles.map((article, index) => (
                <View key={article.id} style={styles.entryItem}>
                  <Text
                    style={styles.entryTitle}
                    numberOfLines={2}
                    onPress={() => (window.location.hash = `#/article/${encodeURIComponent(article.id)}`)}
                  >
                    {article.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Center column - Profile content */}
        <View style={[styles.centerColumn, isTablet && styles.centerColumnTablet]}>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: profileUser.photoURL || 'https://via.placeholder.com/200x200?text=User'
                  }}
                  style={styles.avatar}
                />
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{profileUser.displayName}</Text>
                {profileUser.bio && (
                  <Text style={styles.bio}>{profileUser.bio}</Text>
                )}
                
                {!isOwnProfile && currentUser && (
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={[styles.followButton, isFollowing && styles.followingButton]}
                      onPress={handleFollow}
                    >
                      <UsersIconAlt size={16} color={isFollowing ? theme.colors.textSecondary : theme.colors.surface} />
                      <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profileUser.stats.entries}</Text>
                <Text style={styles.statLabel}>entries</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profileUser.stats.points}</Text>
                <Text style={styles.statLabel}>points</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profileUser.stats.followers}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{profileUser.stats.following}</Text>
                <Text style={styles.statLabel}>following</Text>
              </View>
            </View>

            {/* Most Liked Entry */}
            {renderMostLikedEntry()}

            {/* Recent Entries */}
            <View style={styles.entriesSection}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              {userEntries.length > 0 ? (
                userEntries.map((entry) => (
                  <View key={entry.id} style={styles.entryCard}>
                    <EntryItem
                      entry={entry}
                      article={entry.article}
                      showActions={false}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.noEntriesText}>No entries yet</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Right column */}
        {!isTablet && (
          <View style={styles.rightColumn}>
            <Leaderboard />
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: theme.layout.navigationWidth + theme.spacing.xl,
    paddingRight: theme.spacing.lg,
    maxWidth: 1480,
  },
  leftColumn: {
    width: theme.layout.leftColumnWidth,
    paddingRight: theme.spacing.md,
  },
  leftColumnTablet: {
    display: 'none', // Hide on tablet
  },
  centerColumn: {
    width: theme.layout.centerColumnWidth,
    paddingHorizontal: theme.spacing.md,
  },
  centerColumnTablet: {
    width: theme.layout.tabletCenterWidth,
  },
  rightColumn: {
    width: theme.layout.rightColumnWidth,
    paddingLeft: theme.spacing.md,
  },
  mobileContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxxl,
    marginBottom: theme.spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  recentEntriesContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  entriesList: {
    maxHeight: 400,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
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
    color: theme.colors.primary,
    lineHeight: 18,
  },
  placeholderText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    marginRight: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardBackground,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  profileActions: {
    flexDirection: 'row',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  followingButton: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  followButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fonts.weights.medium,
  },
  followingButtonText: {
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: theme.spacing.xs,
  },
  mostLikedSection: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quoteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  quoteText: {
    fontSize: 16,
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.bold,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  mostLikedEntry: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.sm,
  },
  entryContent: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  entryArticle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  entryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.fonts.weights.medium,
  },
  entryDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  entriesSection: {
    padding: theme.spacing.md,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noEntriesText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export { UserProfileScreen };
