import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { theme } from '../../styles/theme';
import { Article } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { reportArticle } from '../../store/slices/articlesSlice';

interface Props {
  article: Article;
  entryCount: number;
}

export const ArticleHeader: React.FC<Props> = ({ article, entryCount }) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState('');

  const submitReport = async () => {
    if (!user) { setShowReport(false); return; }
    try {
      await dispatch(reportArticle({ articleId: article.id, userId: user.id, reason: reason || 'inappropriate' })).unwrap();
    } finally {
      setShowReport(false);
      setReason('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{article.category}</Text>
        </View>
        <TouchableOpacity style={styles.flagBtn} onPress={() => setShowReport(true)}>
          <Text style={styles.flagText}>🚩 Report</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>{article.title}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{entryCount}</Text>
          <Text style={styles.statLabel}>entries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{article.stats.likes}</Text>
          <Text style={styles.statLabel}>likes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{article.stats.views}</Text>
          <Text style={styles.statLabel}>views</Text>
        </View>
      </View>

      {showReport && (
        <Modal transparent animationType="fade" visible={showReport} onRequestClose={() => setShowReport(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, width: 360, maxWidth: '90%' }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Report Article</Text>
              <TextInput
                placeholder="Describe the issue (optional)"
                value={reason}
                onChangeText={setReason}
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  
  // Header top row
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold as any,
    textTransform: 'capitalize' as any,
  },
  flagBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.overlay,
  },
  flagText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium as any,
  },
  
  // Title and description
  title: {
    fontSize: 28,
    fontWeight: theme.fonts.weights.bold as any,
    color: theme.colors.text,
    lineHeight: 36,
    marginBottom: theme.spacing.sm,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold as any,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.borderLight,
  },
});


