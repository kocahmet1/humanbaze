import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { RawSignal, ScoredSignal } from '../types';
import { aggregateSignals, normalizeAndDedup, scoreSignals, filterAlreadySeen, SourceConfig, listPendingSignals } from '../services/ingestion';
import { DEFAULT_FEEDS } from '../services/sources/blogs';
import { publishSignals } from '../services/newsPublisher';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const NewsIngestionModal: React.FC<Props> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState<ScoredSignal[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sourceCfg, setSourceCfg] = useState<SourceConfig>({ arxiv: true, hn: true, blogs: true, blogFeeds: DEFAULT_FEEDS, limitPerSource: 30 });
  const [stage, setStage] = useState<'config'|'review'>('config');

  useEffect(() => {
    if (!visible) return;
    setStage('config');
    setSignals([]);
    setSelected({});
  }, [visible]);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const raw = await aggregateSignals(sourceCfg);
      const clean = normalizeAndDedup(raw);
      const unseen = await filterAlreadySeen(clean);
      const ranked = scoreSignals(unseen).sort((a, b) => b.score - a.score).slice(0, 50);
      setSignals(ranked);
      setSelected({});
      setStage('review');
      if (ranked.length === 0) {
        console.warn('[ingest] No signals returned for config', sourceCfg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const pending = await listPendingSignals(100);
      const ranked = pending.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setSignals(ranked);
      setSelected({});
      setStage('review');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const publishSelected = async () => {
    const chosen = signals.filter((s) => selected[s.id]);
    if (chosen.length === 0) return;
    setLoading(true);
    try {
      await publishSignals(chosen, 'per_item');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>AI News Ingestion</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
        </View>
        {stage === 'config' ? (
          <>
            <Text style={styles.subtitle}>Choose sources to fetch (some RSS providers block CORS; the app uses a public dev proxy when needed)</Text>
            <View style={styles.sourceRow}>
              <Checkbox label="arXiv" value={!!sourceCfg.arxiv} onToggle={() => setSourceCfg((c) => ({ ...c, arxiv: !c.arxiv }))} />
              <Checkbox label="Hacker News" value={!!sourceCfg.hn} onToggle={() => setSourceCfg((c) => ({ ...c, hn: !c.hn }))} />
              <Checkbox label="Company Blogs" value={!!sourceCfg.blogs} onToggle={() => setSourceCfg((c) => ({ ...c, blogs: !c.blogs }))} />
            </View>
            <Text style={styles.note}>Limit per source</Text>
            <View style={styles.limitsRow}>
              {([10,20,30,50] as const).map((n) => (
                <TouchableOpacity key={n} onPress={() => setSourceCfg((c) => ({ ...c, limitPerSource: n }))} style={[styles.pill, sourceCfg.limitPerSource === n && styles.pillActive]}>
                  <Text style={[styles.pillText, sourceCfg.limitPerSource === n && styles.pillTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={fetchSignals} disabled={loading} style={[styles.primaryBtn, { marginTop: 12, flex: 1 }]}>
                <Text style={styles.primaryBtnText}>{loading ? 'Fetching...' : 'Fetch Candidates'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={loadPending} disabled={loading} style={[styles.secondaryBtn, { marginTop: 12, marginLeft: 8 }]}>
                <Text style={styles.secondaryBtnText}>{loading ? 'Loading...' : 'Load Pending'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Select items to publish as individual articles</Text>
            <ScrollView style={{ maxHeight: 520 }}>
              {loading ? (
                <Text style={styles.note}>Loading signals...</Text>
              ) : signals.length === 0 ? (
                <Text style={styles.note}>No new items found</Text>
              ) : (
                signals.map((s) => (
                  <TouchableOpacity key={s.id} style={[styles.item, selected[s.id] && styles.itemSelected]} onPress={() => toggle(s.id)}>
                    <View style={styles.checkbox}>{selected[s.id] && <Text style={styles.checkboxMark}>✓</Text>}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle} numberOfLines={2}>{s.title}</Text>
                      <Text style={styles.itemMeta}>{s.source.toUpperCase()} • {new Date(s.publishedAt).toLocaleString()} • Score {s.score.toFixed(2)}</Text>
                      {!!s.summary && <Text style={styles.itemSummary} numberOfLines={3}>{s.summary}</Text>}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity onPress={publishSelected} disabled={loading} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{loading ? 'Publishing...' : 'Publish Selected'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const Checkbox: React.FC<{ label: string; value: boolean; onToggle: () => void }> = ({ label, value, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={styles.checkWrap}>
    <View style={[styles.checkbox, value && styles.checkboxFilled]}>{value && <Text style={styles.checkboxMark}>✓</Text>}</View>
    <Text style={styles.checkLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '92%', maxWidth: 860, backgroundColor: theme.colors.background, borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginBottom: 8 },
  note: { color: theme.colors.textSecondary, paddingVertical: 12 },
  item: { flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginBottom: 8 },
  itemSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.overlay },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxFilled: { backgroundColor: theme.colors.overlay },
  checkboxMark: { color: theme.colors.primary, fontWeight: '800' },
  checkWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  checkLabel: { marginLeft: 6, color: theme.colors.text },
  itemTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  itemMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  itemSummary: { fontSize: 12, color: theme.colors.text, marginTop: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  limitsRow: { flexDirection: 'row', marginBottom: 4 },
  pill: { borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8 },
  pillActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.overlay },
  pillText: { color: theme.colors.textSecondary },
  pillTextActive: { color: theme.colors.primary, fontWeight: '700' },
  footer: { marginTop: 8 },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: theme.colors.surface, fontWeight: '700' },
});


