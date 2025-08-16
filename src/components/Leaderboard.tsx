import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setLeaderboardPeriod } from '../store/slices/uiSlice';
import { fetchLeaderboard } from '../store/slices/usersSlice';
import { theme } from '../styles/theme';

interface LeaderboardProps {
  onUserPress?: (userId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onUserPress }) => {
  const dispatch = useDispatch();
  const { leaderboard } = useSelector((state: RootState) => state.users);
  const { leaderboardPeriod } = useSelector((state: RootState) => state.ui);

  const handlePeriodChange = (period: 'recent_creators' | 'top_likes_24h') => {
    dispatch(setLeaderboardPeriod(period));
  };

  useEffect(() => {
    dispatch<any>(fetchLeaderboard({ period: leaderboardPeriod, limit: 10 }));
  }, [dispatch, leaderboardPeriod]);

  const handleUserPress = (userId: string) => {
    if (onUserPress) {
      onUserPress(userId);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              styles.periodButtonLeft,
              leaderboardPeriod === 'recent_creators' && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange('recent_creators')}
          >
            <Text style={[
              styles.periodButtonText,
              leaderboardPeriod === 'recent_creators' && styles.periodButtonTextActive
            ]}>
              Latest Creators
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.periodButton,
              styles.periodButtonRight,
              leaderboardPeriod === 'top_likes_24h' && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange('top_likes_24h')}
          >
            <Text style={[
              styles.periodButtonText,
              leaderboardPeriod === 'top_likes_24h' && styles.periodButtonTextActive
            ]}>
              Top Likes (24h)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.leaderboardList}>
        {leaderboard.length > 0 ? (
          leaderboard.map((user: any, index) => (
            <TouchableOpacity 
              key={user.id} 
              style={styles.leaderboardItem}
              onPress={() => handleUserPress(user.id)}
              activeOpacity={0.7}
              disabled={!onUserPress}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>
                  {getRankIcon(index)}
                </Text>
              </View>
              
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={[styles.userNameText, onUserPress && styles.clickableUserName]} numberOfLines={1}>
                  {user.displayName}
                </Text>
                {user.leaderboardValue !== undefined ? (
                  <Text style={styles.userPointsText}>
                    {leaderboardPeriod === 'top_likes_24h' ? `${user.leaderboardValue} likes` : `created recently`}
                  </Text>
                ) : (
                  <Text style={styles.userPointsText}>
                    {user.stats.points} pts
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No data available for this period
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.borderLight}`,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    padding: 3,
    gap: theme.spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
  },
  periodButtonLeft: {
    marginRight: 0,
  },
  periodButtonRight: {
    marginLeft: 0,
  },
  periodButtonActive: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    ...theme.shadows.sm,
  },
  periodButtonText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    transition: `color ${theme.animations.fast} ${theme.animations.ease}`,
  },
  periodButtonTextActive: {
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.bold,
  },
  leaderboardList: {
    maxHeight: 300,
  },
  leaderboardItem: {
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
      transform: 'translateX(4px)',
    },
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  rankText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  userAvatarText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
    transition: `color ${theme.animations.fast} ${theme.animations.ease}`,
  },
  clickableUserName: {
    color: theme.colors.primary,
    '&:hover': {
      color: theme.colors.primaryLight,
    },
  },
  userPointsText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.medium,
  },
  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
