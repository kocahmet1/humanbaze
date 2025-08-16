#!/usr/bin/env node

import 'dotenv/config';
import { aggregateSignals, normalizeAndDedup, scoreSignals, filterAlreadySeen, saveSignals } from '../services/ingestion';
import { publishSignals } from '../services/newsPublisher';

async function main() {
  const args = new Set(process.argv.slice(2));
  const mode: 'digest' | 'per_item' = args.has('--digest') ? 'digest' : 'per_item';
  const manual = args.has('--manual') || args.size === 0;
  const prepareOnly = args.has('--prepare-only');
  const sourcesSpecified = args.has('--arxiv') || args.has('--hn') || args.has('--blogs');
  const cfg = {
    arxiv: sourcesSpecified ? args.has('--arxiv') : true,
    hn: sourcesSpecified ? args.has('--hn') : true,
    blogs: sourcesSpecified ? args.has('--blogs') : true,
    limitPerSource: parseInt(process.env.AI_NEWS_LIMIT_PER_SOURCE || '30')
  } as any;
  const maxItems = parseInt(process.env.AI_NEWS_MAX_ITEMS || '15');

  console.log('📰 Ingesting AI sources...');
  const raw = await aggregateSignals(cfg);
  console.log(`Fetched ${raw.length} signals`);
  const clean = normalizeAndDedup(raw);
  const unseen = await filterAlreadySeen(clean);
  const ranked = scoreSignals(unseen).sort((a, b) => b.score - a.score);
  const selected = ranked.slice(0, maxItems);
  console.log(`Selected ${selected.length} signals for publishing (${mode})`);

  // Save queue snapshot
  await saveSignals(selected, 'new');

  if (prepareOnly) {
    console.log('Prepared candidates only (no publishing). Review and publish from Admin → AI News Ingestion → Load Pending.');
    return;
  }

  if (selected.length === 0) {
    console.log('Nothing new to publish.');
    return;
  }

  const result = await publishSignals(selected, mode);
  console.log(`Published: ${result.articles} articles, ${result.entries} entries`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error('💥 Ingestion failed:', e);
    process.exit(1);
  });
}


