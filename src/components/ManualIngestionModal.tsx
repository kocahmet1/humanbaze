import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { manualIngestionService, ManualIngestionPlan } from '../services/manualIngestion';
import { geminiService } from '../services/gemini';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchFeedEntries } from '../store/slices/entriesSlice';
import { fetchRecentArticles } from '../store/slices/articlesSlice';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ManualIngestionModal: React.FC<Props> = ({ visible, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [stage, setStage] = useState<'paste' | 'review'>('paste');
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ManualIngestionPlan | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (visible) {
      setStage('paste');
      setInput('');
      setPrompt('');
      setPlan(null);
      setSelected({});
      setLoading(false);
    }
  }, [visible]);

  if (!visible) return null;

  const propose = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const p = await manualIngestionService.proposeFromText(
        input.trim(),
        prompt.trim() ? prompt.trim() : undefined
      );
      setPlan(p);
      setStage('review');
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not parse text');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (idx: number) => {
    setSelected((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const publish = async () => {
    if (!plan) return;
    const filtered: ManualIngestionPlan = {
      titles: plan.titles.filter((_, idx) => !!selected[idx])
    };
    if (filtered.titles.length === 0) return;
    setLoading(true);
    try {
      const res = await manualIngestionService.publishPlan(filtered);
      console.log('[ManualIngestionModal] Publish result:', res);
      const ids = (res.details || []).map(d => `${d.title} (id: ${d.articleId}, entries: ${d.entryCount})`).join('\n');
      Alert.alert('Published', `Articles: ${res.articlesCreated}, Entries: ${res.entriesCreated}${ids ? `\n\nCreated:\n${ids}` : ''}`);
      // Refresh home data sources so new content appears in lists without reload
      dispatch(fetchRecentArticles(10));
      dispatch(fetchFeedEntries({ limit: 20 }));
      if (res.articleIds && res.articleIds.length > 0) {
        // Navigate to the first created article so you can verify immediately
        try { window.location.hash = `#/article/${encodeURIComponent(res.articleIds[0])}`; } catch {}
      }
      onClose();
    } catch (e: any) {
      console.error('[ManualIngestionModal] Publish failed', e);
      Alert.alert('Failed', e?.message || 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Manual AI News Ingestion</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
        </View>
        {stage === 'paste' ? (
          <>
            <Text style={styles.subtitle}>Paste recent AI developments. The AI will propose titles and entries. You will pick which to publish.</Text>
            <Text style={[styles.subtitle, { marginTop: 6 }]}>Prompt (optional): You can view/modify the instruction sent to the LLM.</Text>
            <TextInput
              style={[styles.textarea, { minHeight: 240 }]}
              multiline
              placeholder="Leave empty to use default prompt."
              value={prompt}
              onChangeText={setPrompt}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setPrompt(geminiService.getManualIngestionPromptTemplate())}
                style={[styles.secondaryBtn, { marginBottom: 8 }]}
              >
                <Text style={styles.secondaryBtnText}>Load Default Prompt</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textarea}
              multiline
              placeholder="Paste text here..."
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity onPress={propose} disabled={loading || !input.trim()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{loading ? 'Analyzing...' : 'Propose Titles & Entries'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Select titles to publish. Tap to toggle selection.</Text>
            <ScrollView style={{ maxHeight: 720 }}>
              {plan?.titles.map((t, idx) => (
                <TouchableOpacity key={idx} style={[styles.item, selected[idx] && styles.itemSelected]} onPress={() => toggle(idx)}>
                  <View style={styles.checkbox}>{selected[idx] && <Text style={styles.checkboxMark}>✓</Text>}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{t.title}</Text>
                    {!!t.description && <Text style={styles.itemMeta}>{t.description}</Text>}
                    <View style={{ marginTop: 6 }}>
                      {t.entries.slice(0, 3).map((e, i) => (
                        <Text key={i} style={styles.itemEntry} numberOfLines={3}>• {e.content}</Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity onPress={publish} disabled={loading} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{loading ? 'Publishing...' : 'Publish Selected'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '96%', maxWidth: 1200, backgroundColor: theme.colors.background, borderRadius: 12, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginBottom: 8 },
  textarea: { minHeight: 220, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 14, color: theme.colors.text, textAlignVertical: 'top', fontSize: 15 },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: theme.colors.surface, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  secondaryBtnText: { color: theme.colors.textSecondary },
  item: { flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 8 },
  itemSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.overlay },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 8 },
  checkboxMark: { color: theme.colors.primary, fontWeight: '800' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  itemMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  itemEntry: { fontSize: 12, color: theme.colors.text, marginTop: 2 },
  footer: { marginTop: 8 },
});


