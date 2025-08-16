import { botService } from './bot';
import { articlesService } from './articles';
import { entriesService } from './entries';
import { RawSignal } from '../types';
import { getYouTubeVideoInfo } from '../utils/youtube';

export interface PublishMapping { [signalId: string]: { articleId: string; entryId: string }; }

export async function publishSignals(signals: RawSignal[], mode: 'digest' | 'per_item' = 'digest'): Promise<{ articles: number; entries: number; mapping: PublishMapping }>{
  const bot = await botService.initializeBotUser();
  try {
    await botService.signInAsBot();
  } catch (e) {
    // Proceed; Firestore writes require auth but if rules allow service role, this may still work in dev
  }

  if (mode === 'digest') {
    const date = new Date();
    const title = `AI Daily: ${date.toISOString().slice(0, 10)}`;
    const article = await articlesService.createArticle({
      title,
      description: 'Daily curated updates from AI research, releases, and community.',
      category: 'technology',
      createdBy: bot.id,
      slug: '',
    } as any);

    let entries = 0;
    const mapping: PublishMapping = {};
    for (const s of signals) {
      const contentLines: string[] = [
        `Source: ${s.source.toUpperCase()} | Published: ${new Date(s.publishedAt).toLocaleString()}`,
        '',
        s.summary ? s.summary : '',
        '',
        `Link: ${s.url}`,
      ].filter(Boolean);

      const yt = getYouTubeVideoInfo(s.url);
      if (yt) {
        const entry = await entriesService.createEntry({
          articleId: article.id,
          userId: bot.id,
          content: contentLines.join('\n'),
          type: 'video',
          media: { type: 'video', url: yt.embedUrl, thumbnail: yt.thumbnailUrl },
        } as any);
        mapping[s.id] = { articleId: article.id, entryId: entry.id };
      } else {
        const entry = await entriesService.createEntry({
          articleId: article.id,
          userId: bot.id,
          content: `${s.title}\n\n${contentLines.join('\n')}`,
          type: 'text',
        } as any);
        mapping[s.id] = { articleId: article.id, entryId: entry.id };
      }
      entries++;
    }
    return { articles: 1, entries, mapping };
  }

  // per_item mode
  let articles = 0;
  let entries = 0;
  const mapping: PublishMapping = {};
  for (const s of signals) {
    const article = await articlesService.createArticle({
      title: s.title,
      description: s.summary || undefined,
      category: mapSignalToCategory(s),
      createdBy: bot.id,
      slug: '',
    } as any);
    articles++;

    const yt = getYouTubeVideoInfo(s.url);
    if (yt) {
      const entry = await entriesService.createEntry({
        articleId: article.id,
        userId: bot.id,
        content: `Source: ${s.source.toUpperCase()} | ${new Date(s.publishedAt).toLocaleString()}\n${s.summary || ''}\n${s.url}`,
        type: 'video',
        media: { type: 'video', url: yt.embedUrl, thumbnail: yt.thumbnailUrl },
      } as any);
      mapping[s.id] = { articleId: article.id, entryId: entry.id };
    } else {
      const entry = await entriesService.createEntry({
        articleId: article.id,
        userId: bot.id,
        content: `${s.summary || ''}\n\nLink: ${s.url}`,
        type: 'text',
      } as any);
      mapping[s.id] = { articleId: article.id, entryId: entry.id };
    }
    entries++;
  }
  return { articles, entries, mapping };
}

function mapSignalToCategory(s: RawSignal): string {
  if (s.source === 'arxiv') return 'science';
  if (s.source === 'hn') return 'business';
  if (s.source === 'blog') return 'business';
  return 'technology';
}


