import { geminiService } from './gemini';
import { articlesService } from './articles';
import { entriesService } from './entries';
import { botService } from './bot';
import { EntryType } from '../types';

export interface ManualIngestionPlanTitle {
  title: string;
  description?: string;
  category?: string;
  entries: Array<{ content: string; type?: EntryType }>;
}

export interface ManualIngestionPlan {
  titles: ManualIngestionPlanTitle[];
}

export interface ManualIngestionPublishResult {
  articlesCreated: number;
  entriesCreated: number;
  articleIds: string[];
  details?: Array<{ articleId: string; title: string; entryCount: number }>;
}

class ManualIngestionService {
  async proposeFromText(rawText: string, templateOverride?: string): Promise<ManualIngestionPlan> {
    return geminiService.parseManualIngestionText(rawText, templateOverride);
  }

  async publishPlan(plan: ManualIngestionPlan): Promise<ManualIngestionPublishResult> {
    const bot = await botService.initializeBotUser();
    try {
      await botService.signInAsBot();
    } catch {}

    let articlesCreated = 0;
    let entriesCreated = 0;
    const articleIds: string[] = [];
    const details: Array<{ articleId: string; title: string; entryCount: number }> = [];

    for (const t of plan.titles) {
      const articlePayload: any = {
        title: t.title,
        category: t.category || 'general',
        createdBy: bot.id,
        slug: '',
      };
      if (t.description && t.description.trim()) {
        articlePayload.description = t.description.trim();
      }
      const article = await articlesService.createArticle(articlePayload);
      articlesCreated++;
      articleIds.push(article.id);
      let createdForArticle = 0;
      console.log(`[manualIngestion] Created article: ${article.id} - ${article.title}`);

      for (const e of t.entries) {
        await entriesService.createEntry({
          articleId: article.id,
          userId: bot.id,
          content: e.content,
          type: (e.type as EntryType) || 'text',
        } as any);
        entriesCreated++;
        createdForArticle++;
      }

      details.push({ articleId: article.id, title: t.title, entryCount: createdForArticle });
      console.log(`[manualIngestion] Created ${createdForArticle} entries for article ${article.id}`);
    }

    console.log('[manualIngestion] Publish complete', { articlesCreated, entriesCreated, articleIds, details });
    return { articlesCreated, entriesCreated, articleIds, details };
  }
}

export const manualIngestionService = new ManualIngestionService();


