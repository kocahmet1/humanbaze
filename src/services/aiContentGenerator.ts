import { geminiService, AITopic, GeneratedContent } from './gemini';
import { botService } from './bot';
import { articlesService } from './articles';
import { entriesService } from './entries';
import { Article, Entry, EntryType } from '../types';

export interface ContentGenerationConfig {
  maxArticlesPerRun: number;
  maxEntriesPerArticle: number;
  delayBetweenOperations: number; // milliseconds
  categories: string[];
  enabled: boolean;
}

export interface ContentGenerationResult {
  success: boolean;
  articlesCreated: number;
  entriesCreated: number;
  errors: string[];
  topics: AITopic[];
  timestamp: string;
}

/**
 * Main service for automated AI content generation
 * This service coordinates the bot user, Gemini API, and content creation
 */
class AIContentGeneratorService {
  private config: ContentGenerationConfig = {
    maxArticlesPerRun: 5,
    maxEntriesPerArticle: 3,
    delayBetweenOperations: 2000, // 2 seconds
    categories: ['models', 'research', 'industry', 'regulation', 'ethics', 'applications'],
    enabled: true
  };

  private isGenerating = false;

  /**
   * Update the configuration for content generation
   */
  updateConfig(newConfig: Partial<ContentGenerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Content generation config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ContentGenerationConfig {
    return { ...this.config };
  }

  /**
   * Main method to generate and publish AI content
   */
  async generateAndPublishContent(): Promise<ContentGenerationResult> {
    if (this.isGenerating) {
      throw new Error('Content generation already in progress');
    }

    if (!this.config.enabled) {
      throw new Error('Content generation is disabled');
    }

    this.isGenerating = true;
    const result: ContentGenerationResult = {
      success: false,
      articlesCreated: 0,
      entriesCreated: 0,
      errors: [],
      topics: [],
      timestamp: new Date().toISOString()
    };

    try {
      console.log('Starting AI content generation...');

      // Step 1: Initialize bot user
      await botService.initializeBotUser();
      await botService.signInAsBot();
      const botUser = botService.getBotUser();
      
      if (!botUser) {
        throw new Error('Failed to initialize bot user');
      }

      console.log('Bot user initialized:', botUser.displayName);

      // Step 2: Generate trending AI content
      let generatedContent: GeneratedContent;
      try {
        generatedContent = await geminiService.generateTrendingAIContent();
        console.log(`Generated ${generatedContent.topics.length} AI topics`);
      } catch (error: any) {
        console.warn('Failed to generate content from Gemini API, using fallback:', error.message);
        result.errors.push(`Gemini API failed: ${error.message}`);
        generatedContent = geminiService.getFallbackTopics();
      }

      result.topics = generatedContent.topics;

      // Step 3: Create articles for each topic
      const topicsToProcess = generatedContent.topics.slice(0, this.config.maxArticlesPerRun);
      
      for (const topic of topicsToProcess) {
        try {
          await this.wait(this.config.delayBetweenOperations);

          // Create article
          const article = await this.createArticleFromTopic(topic, botUser.id);
          result.articlesCreated++;
          console.log(`Created article: ${article.title}`);

          // Create initial entry with the main content
          await this.wait(this.config.delayBetweenOperations);
          const mainEntry = await this.createEntryForArticle(article.id, topic.content, botUser.id);
          result.entriesCreated++;
          console.log(`Created main entry for article: ${article.title}`);

          // Generate and create additional entries
          const additionalEntryCount = Math.min(
            this.config.maxEntriesPerArticle - 1,
            Math.floor(Math.random() * 3) + 1 // 1-3 additional entries
          );

          if (additionalEntryCount > 0) {
            try {
              const additionalEntries = await geminiService.generateAdditionalEntries(
                topic, 
                [topic.content]
              );

              for (let i = 0; i < Math.min(additionalEntryCount, additionalEntries.length); i++) {
                await this.wait(this.config.delayBetweenOperations);
                await this.createEntryForArticle(article.id, additionalEntries[i], botUser.id);
                result.entriesCreated++;
                console.log(`Created additional entry ${i + 1} for article: ${article.title}`);
              }
            } catch (error: any) {
              console.warn(`Failed to generate additional entries for ${topic.title}:`, error.message);
              result.errors.push(`Additional entries failed for ${topic.title}: ${error.message}`);
            }
          }

        } catch (error: any) {
          console.error(`Failed to create content for topic "${topic.title}":`, error);
          result.errors.push(`Topic "${topic.title}": ${error.message}`);
        }
      }

      result.success = result.articlesCreated > 0;
      console.log(`Content generation completed. Articles: ${result.articlesCreated}, Entries: ${result.entriesCreated}`);

    } catch (error: any) {
      console.error('Content generation failed:', error);
      result.errors.push(`Generation failed: ${error.message}`);
      result.success = false;
    } finally {
      this.isGenerating = false;
    }

    return result;
  }

  /**
   * Create an article from an AI topic
   */
  private async createArticleFromTopic(topic: AITopic, botUserId: string): Promise<Article> {
    const articleData = {
      title: topic.title,
      description: topic.description,
      category: this.mapCategoryToSystem(topic.category),
      createdBy: botUserId,
      slug: '', // Will be generated by the service
    };

    return await articlesService.createArticle(articleData);
  }

  /**
   * Create an entry for an article
   */
  private async createEntryForArticle(articleId: string, content: string, botUserId: string): Promise<Entry> {
    const entryData = {
      articleId,
      userId: botUserId,
      content,
      type: 'text' as EntryType,
    };

    return await entriesService.createEntry(entryData);
  }

  /**
   * Map AI topic categories to system categories
   */
  private mapCategoryToSystem(aiCategory: string): string {
    const categoryMap: { [key: string]: string } = {
      'models': 'technology',
      'research': 'science',
      'industry': 'business',
      'regulation': 'politics',
      'ethics': 'philosophy',
      'applications': 'technology'
    };

    return categoryMap[aiCategory] || 'general';
  }

  /**
   * Utility method to add delays between operations
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if content generation is currently in progress
   */
  isGenerationInProgress(): boolean {
    return this.isGenerating;
  }

  /**
   * Generate content for a specific topic only
   */
  async generateContentForTopic(topicTitle: string): Promise<ContentGenerationResult> {
    const customPrompt = `Generate detailed content about: ${topicTitle}`;
    // This could be extended to generate content for user-specified topics
    return this.generateAndPublishContent();
  }

  /**
   * Get statistics about recent bot activity
   */
  async getBotActivity(): Promise<{
    articlesCreatedToday: number;
    entriesCreatedToday: number;
    lastActivity: string | null;
  }> {
    const botUser = botService.getBotUser();
    if (!botUser) {
      return {
        articlesCreatedToday: 0,
        entriesCreatedToday: 0,
        lastActivity: null
      };
    }

    // This would need to be implemented with proper Firestore queries
    // For now, return placeholder data
    return {
      articlesCreatedToday: 0,
      entriesCreatedToday: 0,
      lastActivity: botUser.lastActive
    };
  }
}

export const aiContentGenerator = new AIContentGeneratorService();
