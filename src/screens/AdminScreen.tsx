import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { adminService } from '../services/admin';
import { theme } from '../styles/theme';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AIContentManager } from '../components/AIContentManager';
import { JSONImportModal } from '../components/JSONImportModal';
import { NewsIngestionModal } from '../components/NewsIngestionModal';
import { ManualIngestionModal } from '../components/ManualIngestionModal';

export const AdminScreen: React.FC = () => {
  const [counts, setCounts] = useState<{ totalArticles: number; totalEntries: number; totalUsers: number; totalReports: number } | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesHasMore, setArticlesHasMore] = useState<boolean>(true);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(false);
  const [articlesLastDoc, setArticlesLastDoc] = useState<any>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [username, setUsername] = useState('');
  const [banMessage, setBanMessage] = useState<string>('');
  const [editEntryId, setEditEntryId] = useState('');
  const [editEntryContent, setEditEntryContent] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showAIContentManager, setShowAIContentManager] = useState(false);
  const [showJSONImportModal, setShowJSONImportModal] = useState(false);
  const [showNewsIngestion, setShowNewsIngestion] = useState(false);
  const [showManualIngestion, setShowManualIngestion] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    (async () => {
      const c = await adminService.getDashboardCounts();
      setCounts(c);
      const r = await adminService.listPendingReports();
      setReports(r);
      await loadArticles(true);
    })();
  }, []);

  const ban = async () => {
    const ok = await adminService.banUserByUsername(username);
    setBanMessage(ok ? `Banned: ${username}` : `User not found: ${username}`);
  };

  const unban = async () => {
    const ok = await adminService.unbanUserByUsername(username);
    setBanMessage(ok ? `Unbanned: ${username}` : `User not found: ${username}`);
  };

  const resolve = async (reportId: string, action: 'delete_entry' | 'delete_article' | 'skip') => {
    await adminService.resolveReport(reportId, action);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const resetWeekly = async () => {
    await adminService.resetWeeklyPoints();
    alert('Weekly points reset');
  };

  const resetMonthly = async () => {
    await adminService.resetMonthlyPoints();
    alert('Monthly points reset');
  };

  const fetchEntry = async () => {
    setEditNote('');
    const entry = await adminService.getEntryById(editEntryId.trim());
    if (!entry) {
      setEditEntryContent('');
      setEditNote('Entry not found');
    } else {
      setEditEntryContent(entry.content || '');
    }
  };

  const saveEntry = async () => {
    await adminService.updateEntryContent(editEntryId.trim(), editEntryContent);
    setEditNote('Updated successfully');
  };

  const loadArticles = async (reset?: boolean) => {
    if (articlesLoading) return;
    setArticlesLoading(true);
    try {
      const service = (await import('../services/articles')).articlesService as any;
      const resp = await service.getArticles({ limit: 50, lastDoc: reset ? null : articlesLastDoc });
      setArticles(prev => reset ? resp.articles : [...prev, ...resp.articles]);
      setArticlesHasMore(resp.hasMore);
      setArticlesLastDoc(resp.lastDoc);
      if (reset) setSelectedArticleIds(new Set());
    } finally {
      setArticlesLoading(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!confirm('Delete this article and all its entries?')) return;
    const result = await adminService.deleteArticleAndEntries(articleId);
    setArticles(prev => prev.filter(a => a.id !== articleId));
    setCounts(c => c ? { 
      ...c, 
      totalArticles: Math.max(0, c.totalArticles - 1), 
      totalEntries: Math.max(0, c.totalEntries - (result?.deletedEntries ?? 0)) 
    } : c);
    setSelectedArticleIds(prev => {
      const next = new Set(prev);
      next.delete(articleId);
      return next;
    });
  };

  const toggleSelect = (articleId: string) => {
    setSelectedArticleIds(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId); else next.add(articleId);
      return next;
    });
  };

  const selectAllOnPage = () => {
    const next = new Set<string>(selectedArticleIds);
    articles.forEach(a => next.add(a.id));
    setSelectedArticleIds(next);
  };

  const clearSelection = () => setSelectedArticleIds(new Set());

  const deleteSelected = async () => {
    const ids = Array.from(selectedArticleIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected article(s) and all their entries?`)) return;
    const results = await Promise.all(ids.map(id => adminService.deleteArticleAndEntries(id)));
    const deletedEntriesSum = results.reduce((sum, r) => sum + (r?.deletedEntries ?? 0), 0);
    setArticles(prev => prev.filter(a => !selectedArticleIds.has(a.id)));
    setCounts(c => c ? {
      ...c,
      totalArticles: Math.max(0, c.totalArticles - ids.length),
      totalEntries: Math.max(0, c.totalEntries - deletedEntriesSum),
    } : c);
    setSelectedArticleIds(new Set());
  };

  const isEmailAdmin = user?.email?.toLowerCase() === 'ahmetkoc1@gmail.com';
  if (!user || (!isEmailAdmin && user.role !== 'admin')) {
    return (
      <View style={styles.container}><Text style={styles.title}>Access denied</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <View style={styles.statsRow}>
        <Stat title="Articles" value={counts?.totalArticles ?? 0} />
        <Stat title="Entries" value={counts?.totalEntries ?? 0} />
        <Stat title="Users" value={counts?.totalUsers ?? 0} />
        <Stat title="Reports" value={counts?.totalReports ?? 0} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ban User</Text>
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
        <View style={styles.row}>
          <Button label="Ban" onPress={ban} />
          <Button label="Unban" onPress={unban} />
        </View>
        {!!banMessage && <Text style={styles.note}>{banMessage}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reset Points</Text>
        <View style={styles.row}>
          <Button label="Reset Weekly" onPress={resetWeekly} />
          <Button label="Reset Monthly" onPress={resetMonthly} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Content Generation</Text>
        <Text style={styles.note}>Manage automated AI content generation using Gemini API</Text>
        <View style={styles.row}>
          <Button label="Open AI Manager" onPress={() => setShowAIContentManager(true)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI News Ingestion</Text>
        <Text style={styles.note}>Fetch latest AI signals (arXiv, HN, Blogs) and select which to publish as articles</Text>
        <View style={styles.row}>
          <Button label="Open Ingestion" onPress={() => setShowNewsIngestion(true)} />
          <Button label="Manual Paste Ingestion" onPress={() => setShowManualIngestion(true)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>JSON Import</Text>
        <Text style={styles.note}>Import articles and entries from JSON file with custom time periods and random user assignment</Text>
        <View style={styles.row}>
          <Button label="Import JSON Data" onPress={() => setShowJSONImportModal(true)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>All Articles (50 per page)</Text>
        <View style={styles.rowSpace}>
          <View style={styles.rowCenter}>
            <TouchableOpacity onPress={selectAllOnPage} style={[styles.checkbox, articles.length && selectedArticleIds.size >= articles.length ? styles.checkboxChecked : null]}>
              {(articles.length && selectedArticleIds.size >= articles.length) ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </TouchableOpacity>
            <Text style={{ color: theme.colors.text, marginLeft: 6 }}>Select all on page</Text>
          </View>
          <View style={styles.row}>
            <Button label={`Delete Selected (${selectedArticleIds.size})`} onPress={deleteSelected} />
            <Button label="Clear" onPress={clearSelection} />
          </View>
        </View>
        {articles.map(a => (
          <View key={a.id} style={styles.articleItem}>
            <TouchableOpacity onPress={() => toggleSelect(a.id)} style={[styles.checkbox, selectedArticleIds.has(a.id) ? styles.checkboxChecked : null]}>
              {selectedArticleIds.has(a.id) ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.articleTitle}>{a.title}</Text>
              <Text style={styles.note}>ID: {a.id} • Category: {a.category} • Entries: {a.stats?.entries ?? 0}</Text>
            </View>
            <Button label="Delete" onPress={() => deleteArticle(a.id)} />
          </View>
        ))}
        {articlesHasMore && (
          <View style={{ marginTop: 8 }}>
            <Button label={articlesLoading ? 'Loading…' : 'Load More'} onPress={() => loadArticles()} />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Edit Entry</Text>
        <View style={styles.rowCenter}>
          <TextInput placeholder="Entry ID" value={editEntryId} onChangeText={setEditEntryId} style={[styles.input, { flex: 1, marginRight: 8 }]} />
          <Button label="Fetch" onPress={fetchEntry} />
        </View>
        <TextInput
          placeholder="Entry content"
          value={editEntryContent}
          onChangeText={setEditEntryContent}
          style={[styles.input, { height: 120, marginTop: 8 }]} multiline
        />
        <View style={styles.row}>
          <Button label="Save" onPress={saveEntry} />
        </View>
        {!!editNote && <Text style={styles.note}>{editNote}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Reports</Text>
        {reports.map((r) => (
          <View key={r.id} style={styles.reportItem}>
            <Text style={styles.reportText}>{r.reason || r.subject || 'Report'}</Text>
            {r.entryId && <Text style={styles.note}>Entry ID: {r.entryId}</Text>}
            {r.articleId && <Text style={styles.note}>Article ID: {r.articleId}</Text>}
            <View style={styles.row}>
              {r.entryId && <Button label="Delete Entry" onPress={() => resolve(r.id, 'delete_entry')} />} 
              {r.articleId && <Button label="Delete Article" onPress={() => resolve(r.id, 'delete_article')} />} 
              <Button label="Skip" onPress={() => resolve(r.id, 'skip')} />
            </View>
          </View>
        ))}
      </View>

      <AIContentManager 
        visible={showAIContentManager}
        onClose={() => setShowAIContentManager(false)}
      />

      <JSONImportModal 
        visible={showJSONImportModal}
        onClose={() => setShowJSONImportModal(false)}
      />

      <NewsIngestionModal 
        visible={showNewsIngestion}
        onClose={() => setShowNewsIngestion(false)}
      />

      <ManualIngestionModal
        visible={showManualIngestion}
        onClose={() => setShowManualIngestion(false)}
      />
    </ScrollView>
  );
};

const Stat: React.FC<{ title: string; value: number; }> = ({ title, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const Button: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: theme.colors.primary },
  statTitle: { fontSize: 12, color: theme.colors.textMuted },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.colors.text },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
  },
  row: { flexDirection: 'row', marginTop: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  note: { marginTop: 6, color: theme.colors.textMuted },
  title: { fontSize: 18, color: theme.colors.text, textAlign: 'center', marginTop: 32 },
  reportItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  reportText: { color: theme.colors.text, marginBottom: 6 },
  articleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  articleTitle: { color: theme.colors.text, fontWeight: '600', marginBottom: 2 },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 4, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkboxMark: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 14 },
});


