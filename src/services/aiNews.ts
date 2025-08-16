import { aggregateSignals, normalizeAndDedup, scoreSignals, filterAlreadySeen, saveSignals } from './ingestion';
import { publishSignals } from './newsPublisher';

export async function runAiNewsIngestion(mode: 'digest' | 'per_item' = 'digest', maxItems: number = 15): Promise<{ selected: number; articles: number; entries: number; }>{
  const raw = await aggregateSignals();
  const clean = normalizeAndDedup(raw);
  const unseen = await filterAlreadySeen(clean);
  const ranked = scoreSignals(unseen).sort((a, b) => b.score - a.score);
  const selected = ranked.slice(0, maxItems);
  await saveSignals(selected, 'new');
  if (selected.length === 0) return { selected: 0, articles: 0, entries: 0 };
  const res = await publishSignals(selected, mode);
  return { selected: selected.length, ...res };
}


