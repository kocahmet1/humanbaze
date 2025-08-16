import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { RawSignal, ScoredSignal } from '../types';
import { fetchArxiv } from './sources/arxiv';
import { fetchHackerNewsAI } from './sources/hn';
import { fetchCompanyBlogs, DEFAULT_FEEDS } from './sources/blogs';

export interface SourceConfig {
  arxiv?: boolean;
  hn?: boolean;
  blogs?: boolean;
  blogFeeds?: string[];
  limitPerSource?: number;
}

export async function aggregateSignals(cfg: SourceConfig = {}): Promise<RawSignal[]> {
  const {
    arxiv = true,
    hn = true,
    blogs = true,
    blogFeeds = DEFAULT_FEEDS,
    limitPerSource = 30,
  } = cfg;

  const tasks: Array<Promise<RawSignal[]>> = [];
  if (arxiv) {
    if (typeof window === 'undefined') {
      tasks.push(fetchArxiv(limitPerSource));
    } else {
      // Browser: call Firebase Function to bypass CORS
      tasks.push(callFetchArxivFunction(limitPerSource));
    }
  }
  if (hn) tasks.push(fetchHackerNewsAI(limitPerSource));
  if (blogs) tasks.push(fetchCompanyBlogs(blogFeeds));
  if (tasks.length === 0) return [];
  const results = await Promise.all(tasks);
  return results.flat();
}

async function callFetchArxivFunction(max: number): Promise<RawSignal[]> {
  try {
    // Lazy import to avoid bundling firebase/app if not needed
    const { initializeApp } = await import('firebase/app');
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const app = initializeApp({
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
    const fns = getFunctions(app, undefined, 'us-central1');
    const fn = httpsCallable(fns, 'fetchArxiv');
    const res: any = await fn({ max });
    return Array.isArray(res.data) ? (res.data as RawSignal[]) : [];
  } catch (e) {
    console.warn('[ingest] callable fetchArxiv failed', e);
    return [];
  }
}

function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

export function normalizeAndDedup(signals: RawSignal[]): RawSignal[] {
  const map = new Map<string, RawSignal>();
  for (const s of signals) {
    const key = `${s.source}|${canonicalUrl(s.url)}|${s.title.trim().toLowerCase()}`;
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
}

export function scoreSignals(signals: RawSignal[]): ScoredSignal[] {
  return signals.map((s) => {
    const ageHours = Math.max(1, (Date.now() - new Date(s.publishedAt).getTime()) / 36e5);
    const freshness = 1 / ageHours; // newer -> higher
    const base = s.source === 'arxiv' ? 1.2 : s.source === 'blog' ? 1.1 : s.source === 'hn' ? 1.0 : 1.0;
    const engagement = typeof s.metadata?.points === 'number' ? Math.min(1, s.metadata.points / 300) : 0;
    const score = base + freshness + engagement;
    return { ...s, score };
  });
}

export async function filterAlreadySeen(signals: RawSignal[]): Promise<RawSignal[]> {
  // A simple check using Firestore 'signals' collection by URL
  const unseen: RawSignal[] = [];
  for (const s of signals) {
    try {
      const q = query(collection(db, 'signals'), where('url', '==', canonicalUrl(s.url)));
      const snap = await getDocs(q);
      if (snap.empty) {
        unseen.push(s);
      }
    } catch {
      unseen.push(s);
    }
  }
  return unseen;
}

export async function saveSignals(signals: ScoredSignal[], status: 'new' | 'published' | 'skipped' = 'new'): Promise<void> {
  for (const s of signals) {
    try {
      await addDoc(collection(db, 'signals'), {
        ...s,
        status,
        createdAt: serverTimestamp(),
      });
    } catch {}
  }
}

export async function markSignalsPublished(signalIds: string[], mapping: { [signalId: string]: { articleId: string; entryId: string } }): Promise<void> {
  // We can only update if we know the doc id; since we added anonymously, best-effort: query by id and update
  for (const id of signalIds) {
    try {
      const q = query(collection(db, 'signals'), where('id', '==', id));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => updateDoc(doc(db, 'signals', d.id), {
        status: 'published',
        publishedAt: serverTimestamp(),
        publishedArticleId: mapping?.[id]?.articleId || null,
        publishedEntryId: mapping?.[id]?.entryId || null,
      })));
    } catch {}
  }
}

export async function listPendingSignals(limitCount: number = 50): Promise<ScoredSignal[]> {
  try {
    const q = query(collection(db, 'signals'), where('status', '==', 'new'));
    const snap = await getDocs(q);
    const items: ScoredSignal[] = [] as any;
    snap.docs.forEach(d => {
      const data: any = d.data();
      items.push(data as ScoredSignal);
    });
    return items;
  } catch {
    return [];
  }
}


