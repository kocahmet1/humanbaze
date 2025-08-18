import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Article, Entry, User } from '../types';
import { theme } from '../styles/theme';
import { LikeIcon, DislikeIcon, ShareIcon } from './icons';
import { articlesService } from '../services/articles';
import { usersService } from '../services/users';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ArticleCardProps {
  entry: Entry;
  onPress?: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ entry, onPress }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [canExpand, setCanExpand] = useState<boolean>(false);
  const { isMobile } = useSelector((s: RootState) => s.ui);

  useEffect(() => {
    // Load article and user to render the card like the reference layout
    let mounted = true;
    (async () => {
      try {
        const [a, u] = await Promise.all([
          articlesService.getArticleById(entry.articleId).catch(() => null),
          usersService.getUserById(entry.userId).catch(() => null),
        ]);
        if (mounted) {
          setArticle(a);
          setUser(u);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [entry.articleId, entry.userId]);

  useEffect(() => {
    // Heuristic: if content is long or has media, enable collapse by default
    const longText = (entry.content || '').length > 220;
    const hasMedia = !!entry.media;
    const shouldCollapse = longText || hasMedia;
    setCollapsed(shouldCollapse);
    setCanExpand(shouldCollapse);
  }, [entry.content, entry.media]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const renderContent = () => {
    const renderTextWithLinks = (text: string, numberOfLines?: number) => {
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      const parts = text.split(urlRegex);
      let key = 0;
      return (
        <Text style={styles.entryText} numberOfLines={numberOfLines}
        >
          {parts.map((part) => {
            if (urlRegex.test(part)) {
              const href = part.startsWith('http') ? part : `https://${part}`;
              key += 1;
              return (
                <Text
                  key={`link-${key}`}
                  style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => window.open(href, '_blank')}
                >
                  {part}
                </Text>
              );
            }
            key += 1;
            return <Text key={`t-${key}`}>{part}</Text>;
          })}
        </Text>
      );
    };

    switch (entry.type) {
      case 'image':
        return (
          <View style={styles.rowContent}>
            <View style={styles.mainCopy}>
              {entry.content ? renderTextWithLinks(entry.content, collapsed ? 4 : undefined) : null}
            </View>
            <View style={styles.mediaRight}>
              {entry.media?.url ? (
                <Image
                  source={{ uri: entry.media.thumbnail || entry.media.url }}
                  style={[styles.image, collapsed ? styles.imageCollapsed : styles.imageExpanded] as any}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.mediaText}>📷 Image</Text>
                </View>
              )}
            </View>
          </View>
        );
      
      case 'video':
        return (
          <View style={styles.rowContent}>
            <View style={styles.mainCopy}>
              {entry.content ? renderTextWithLinks(entry.content, collapsed ? 4 : undefined) : null}
            </View>
            <View style={styles.mediaRight}>
              <View style={[styles.videoPlaceholder, collapsed ? styles.imageCollapsed : styles.imageExpanded] }>
                <Text style={styles.mediaText}>🎥 Video</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return entry.content ? renderTextWithLinks(entry.content, collapsed ? 4 : undefined) : null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top bar with title on left and user on right (like reference) */}
      <View style={styles.metaBar}>
        <View style={styles.metaLeft}>
          <Text style={styles.metaPrefix}>in article</Text>
          {!isMobile && (
            <TouchableOpacity
              onPress={() => (window.location.hash = `#/article/${encodeURIComponent(entry.articleId)}`)}
              style={styles.articleTitleWrapper}
            >
              <Text style={styles.articleTitle}>
                {article?.title || 'Untitled article'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.metaRight}>
          <Text style={styles.metaStarted}>started {formatDate(entry.createdAt)}</Text>
          <View style={styles.userInfoRight}>
            <Text style={styles.userNameRight} numberOfLines={1}>
              {user?.displayName || 'Unknown User'}
            </Text>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {(user?.displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Mobile: Title below meta row with ellipsis */}
      {isMobile && (
        <TouchableOpacity
          onPress={() => (window.location.hash = `#/article/${encodeURIComponent(entry.articleId)}`)}
          style={styles.mobileTitleWrapper}
        >
          <Text style={styles.mobileArticleTitle} numberOfLines={2} ellipsizeMode="tail">
            {article?.title || 'Untitled article'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Content row: copy + optional media on right */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Footer actions aligned like the screenshot */}
      <View style={styles.footer}>
        {canExpand && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setCollapsed((prev) => !prev)}
          >
            <Text style={styles.expandText}>{collapsed ? 'Expand' : 'Collapse'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerRightActions}>
          <TouchableOpacity
            onPress={() => (window.location.hash = `#/article/${encodeURIComponent(entry.articleId)}`)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pillAction}>
            <LikeIcon color={theme.colors.primary} size={14} />
            <Text style={styles.pillActionText}>Like</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${theme.colors.borderLight}`,
    transition: `all ${theme.animations.normal} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      ...theme.shadows.lg,
    },
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.borderLight}`,
    flexWrap: 'wrap',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  metaPrefix: {
    color: theme.colors.textMuted,
    fontSize: theme.fonts.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.fonts.weights.medium as any,
  },
  articleTitleWrapper: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  articleTitle: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold as any,
    lineHeight: 24,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
    flexWrap: 'wrap',
    transition: `opacity ${theme.animations.fast} ${theme.animations.ease}`,
    '&:hover': {
      opacity: 0.8,
    },
  },
  mobileTitleWrapper: {
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mobileArticleTitle: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold as any,
    lineHeight: 24,
  },
  metaStarted: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.medium as any,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: { display: 'none' },
  headerRight: {
    width: 160,
    alignItems: 'flex-end',
  },
  userInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  userNameRight: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.md,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  avatarSmallText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  content: {
    marginBottom: theme.spacing.md,
  },
  entryText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    fontWeight: theme.fonts.weights.normal as any,
  },
  rowContent: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  mainCopy: {
    flex: 1,
  },
  mediaRight: {
    width: 180,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.overlay,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: `${theme.colors.primary}05`,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    border: `1px dashed ${theme.colors.borderLight}`,
  },
  videoPlaceholder: {
    height: 120,
    backgroundColor: `${theme.colors.accent}05`,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    border: `1px dashed ${theme.colors.borderLight}`,
  },
  mediaText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  expandButton: {
    borderWidth: 0,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.overlay,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    '&:hover': {
      backgroundColor: theme.colors.borderLight,
    },
  },
  expandText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
  imageCollapsed: {
    height: 120,
  },
  imageExpanded: {
    height: 220,
  },
  footerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginLeft: 'auto',
  },
  readMoreButton: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryLight} 100%)`,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    '&:hover': {
      transform: 'translateY(-1px)',
      ...theme.shadows.md,
    },
  },
  readMoreText: {
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.semibold as any,
    fontSize: theme.fonts.sizes.sm,
    letterSpacing: 0.3,
  },
  pillAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    '&:hover': {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
  },
  pillActionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
});
