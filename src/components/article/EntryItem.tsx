import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Entry, User, Article } from '../../types';
import { theme } from '../../styles/theme';
import { useDispatch } from 'react-redux';
// Note: This app uses hash-based routing, not React Navigation
import { AppDispatch } from '../../store';
import { likeEntry, dislikeEntry, removeLikeDislike } from '../../store/slices/entriesSlice';
import { followUser, unfollowUser, fetchUserById } from '../../store/slices/usersSlice';
import { usersService } from '../../services/users';
import { LikeIcon, DislikeIcon, ShareIcon } from '../icons';
import { useSelector, useDispatch as useReduxDispatch } from 'react-redux';
import { RootState, AppDispatch as Dispatch } from '../../store';
import { openModal } from '../../store/slices/uiSlice';
import { reportEntry as reportEntryThunk } from '../../store/slices/entriesSlice';

interface Props { 
  entry: Entry; 
  article?: Article;
  currentUserId?: string | null;
  entryNumber?: number;
  showActions?: boolean;
}

export const EntryItem: React.FC<Props> = ({ entry, article, currentUserId, entryNumber, showActions = true }) => {
  const dispatch = useDispatch<AppDispatch>();
  const uiDispatch = useReduxDispatch<Dispatch>();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [entryAuthor, setEntryAuthor] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const isLiked = currentUserId ? entry.interactions.likes.includes(currentUserId) : false;
  const isDisliked = currentUserId ? entry.interactions.dislikes.includes(currentUserId) : false;

  // Fetch user data for the entry author
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await usersService.getUserById(entry.userId);
        setEntryAuthor(user);
        
        // Check if current user is following this user
        if (currentUserId && currentUserId !== entry.userId) {
          const following = await usersService.isFollowing(currentUserId, entry.userId);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, [entry.userId, currentUserId]);

  const onLike = async () => {
    if (!currentUserId) return;
    if (isLiked) await dispatch(removeLikeDislike({ entryId: entry.id, userId: currentUserId })).unwrap();
    else await dispatch(likeEntry({ entryId: entry.id, userId: currentUserId })).unwrap();
  };

  const onDislike = async () => {
    if (!currentUserId) return;
    if (isDisliked) await dispatch(removeLikeDislike({ entryId: entry.id, userId: currentUserId })).unwrap();
    else await dispatch(dislikeEntry({ entryId: entry.id, userId: currentUserId })).unwrap();
  };

  const onFollow = async () => {
    if (!currentUserId || !entryAuthor || currentUserId === entryAuthor.id) return;
    
    try {
      if (isFollowing) {
        await dispatch(unfollowUser({ followerId: currentUserId, followingId: entryAuthor.id })).unwrap();
        setIsFollowing(false);
      } else {
        await dispatch(followUser({ followerId: currentUserId, followingId: entryAuthor.id })).unwrap();
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to update follow status:', error);
    }
  };

  const onShare = () => {
    // Simple share functionality - copy to clipboard
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Could show a toast notification here
      console.log('Entry URL copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  const onReport = () => {
    setShowReport(true);
  };

  const submitReport = async () => {
    if (!authUser) return;
    try {
      await dispatch(reportEntryThunk({ entryId: entry.id, userId: authUser.id, reason: reportReason || 'inappropriate' })).unwrap();
      setShowReport(false);
      setReportReason('');
    } catch (e) {
      console.error('Failed to report entry', e);
    }
  };

  const navigateToUserProfile = () => {
    if (entryAuthor) {
      // Navigate using hash-based routing
      // If it's the current user, go to their own profile page
      if (currentUserId === entryAuthor.id) {
        window.location.hash = '#/profile';
      } else {
        window.location.hash = `#/profile/${entryAuthor.id}`;
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-GB', options);
  };

  const renderContent = () => {
    const renderTextWithLinks = (text: string) => {
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      const parts = text.split(urlRegex);
      let key = 0;
      return (
        <Text style={styles.text}>
          {parts.map((part) => {
            if (urlRegex.test(part)) {
              const href = part.startsWith('http') ? part : `https://${part}`;
              const display = part;
              key += 1;
              return (
                <Text
                  key={`link-${key}`}
                  style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => window.open(href, '_blank')}
                >
                  {display}
                </Text>
              );
            }
            key += 1;
            return <Text key={`t-${key}`}>{part}</Text>;
          })}
        </Text>
      );
    };

    if (entry.type === 'image' && entry.media?.url) {
      return (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <Image
            // @ts-ignore React Native Web image
            source={{ uri: entry.media.url }}
            style={styles.image as any}
            resizeMode="cover"
          />
          {entry.content ? renderTextWithLinks(entry.content) : null}
        </View>
      );
    } else if (entry.type === 'video' && entry.media?.url) {
      return (
        <View style={{ marginBottom: theme.spacing.sm }}>
          {/* @ts-ignore - intrinsic web element in RN Web */}
          <iframe
            src={entry.media.url}
            style={{
              width: '100%',
              height: 315,
              border: 'none',
              borderRadius: theme.borderRadius.md,
            }}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {entry.content ? renderTextWithLinks(entry.content) : null}
        </View>
      );
    } else {
      return renderTextWithLinks(entry.content);
    }
  };

  return (
    <View style={styles.container}>
      {/* Entry Number Badge */}
      <View style={styles.entryNumberBadge}>
        <Text style={styles.entryNumberText}>#{entryNumber || '?'}</Text>
      </View>

      {/* Entry Content */}
      <View style={styles.entryContent}>
        {/* Author Header */}
        <View style={styles.authorHeader}>
          <View style={styles.authorInfo}>
            <TouchableOpacity onPress={navigateToUserProfile} activeOpacity={0.7}>
              <View style={styles.avatar}>
                {entryAuthor?.photoURL ? (
                                <Image
                  source={{ uri: entryAuthor.photoURL }}
                  style={styles.avatarImage as any}
                />
                ) : (
                  <Text style={styles.avatarText}>
                    {entryAuthor?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.authorDetails}>
              <TouchableOpacity onPress={navigateToUserProfile} activeOpacity={0.7}>
                <Text style={styles.authorName}>
                  {entryAuthor?.displayName || 'Loading...'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.timestamp}>
                {formatDate(entry.createdAt)}
              </Text>
            </View>
          </View>
          
          {/* Follow Button */}
          {currentUserId && currentUserId !== entry.userId && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={onFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Entry Content */}
        <View style={styles.contentArea}>
          {renderContent()}
          
          {/* Show article title if provided */}
          {article && (
            <TouchableOpacity 
              style={styles.articleLink}
              onPress={() => window.location.hash = `#/article/${article.id}`}
            >
              <Text style={styles.articleLinkText}>
                📝 {article.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Social Actions */}
        {showActions && (
          <View style={styles.socialActions}>
          <TouchableOpacity
            style={[styles.socialActionBtn, isLiked && styles.activeLike]}
            onPress={onLike}
          >
            <LikeIcon
              color={isLiked ? theme.colors.success : theme.colors.textSecondary}
              size={18}
            />
            <Text style={[styles.socialActionText, isLiked && styles.activeLikeText]}>
              {entry.stats.likes > 0 ? entry.stats.likes : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialActionBtn, isDisliked && styles.activeDislike]}
            onPress={onDislike}
          >
            <DislikeIcon
              color={isDisliked ? theme.colors.error : theme.colors.textSecondary}
              size={18}
            />
            <Text style={[styles.socialActionText, isDisliked && styles.activeDislikeText]}>
              {entry.stats.dislikes > 0 ? entry.stats.dislikes : 'Dislike'}
            </Text>
        </TouchableOpacity>

          <TouchableOpacity style={styles.socialActionBtn} onPress={onShare}>
            <ShareIcon color={theme.colors.textSecondary} size={18} />
            <Text style={styles.socialActionText}>Share</Text>
        </TouchableOpacity>
          
          <View style={styles.socialActionSpacer} />
          
          <TouchableOpacity style={[styles.socialActionBtn, styles.reportBtn]} onPress={onReport}>
            <Text style={styles.reportText}>⋮</Text>
          </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Report Modal */}
      {showReport && (
        <Modal transparent animationType="fade" visible={showReport} onRequestClose={() => setShowReport(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, width: 360, maxWidth: '90%' }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Report Entry</Text>
              <TextInput
                placeholder="Describe the issue (optional)"
                value={reportReason}
                onChangeText={setReportReason}
                style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.text }}
                multiline
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity onPress={() => setShowReport(false)} style={{ paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitReport} style={{ backgroundColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    transition: 'all 0.2s ease',
  },
  
  // Entry number badge
  entryNumberBadge: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  entryNumberText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold as any,
  },
  
  // Content area styles
  entryContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl + theme.spacing.sm,
  },
  
  // Author header styles
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.sm,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: 2,
    transition: 'color 0.2s ease',
  },
  timestamp: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  
  // Follow button styles
  followBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs + 2,
    transition: 'all 0.2s ease',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followBtnText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
  followingBtnText: {
    color: theme.colors.primary,
  },
  
  // Content area styles
  contentArea: {
    marginBottom: theme.spacing.md,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    lineHeight: 24,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.overlay,
    marginBottom: theme.spacing.sm,
  },
  
  // Article link
  articleLink: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  articleLinkText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
  },
  
  // Social actions styles
  socialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  socialActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    transition: 'all 0.2s ease',
  },
  socialActionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
  socialActionSpacer: {
    flex: 1,
  },
  reportBtn: {
    paddingHorizontal: theme.spacing.sm,
  },
  reportText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.bold as any,
  },
  
  // Active state styles
  activeLike: {
    backgroundColor: theme.colors.success + '15',
  },
  activeDislike: {
    backgroundColor: theme.colors.error + '15',
  },
  activeLikeText: {
    color: theme.colors.success,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  activeDislikeText: {
    color: theme.colors.error,
    fontWeight: theme.fonts.weights.semibold as any,
  },
});



