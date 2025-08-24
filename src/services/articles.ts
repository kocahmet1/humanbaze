import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '../types';

class ArticlesService {
  private articlesCollection = collection(db, 'articles');

  // Create article
  async createArticle(articleData: Omit<Article, 'id' | 'createdAt' | 'lastUpdated' | 'stats'>): Promise<Article> {
    try {
      const docRef = await addDoc(this.articlesCollection, {
        ...articleData,
        slug: this.createSlug(articleData.title),
        stats: {
          entries: 0,
          likes: 0,
          views: 0,
        },
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      const newDoc = await getDoc(docRef);
      const data = newDoc.data();
      return {
        id: docRef.id,
        ...data,
        createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
      } as Article;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create article');
    }
  }

  // Get article by ID
  async getArticleById(articleId: string): Promise<Article> {
    try {
      const docRef = doc(db, 'articles', articleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Article not found');
      }

      // Increment view count
      try {
        await updateDoc(docRef, {
          'stats.views': increment(1),
        });
      } catch {}

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastUpdated: data.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
      } as Article;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch article');
    }
  }

  // Get article by slug
  async getArticleBySlug(slug: string): Promise<Article> {
    try {
      const qRef = query(this.articlesCollection, where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(qRef);
      if (snapshot.empty) {
        throw new Error('Article not found');
      }
      const docSnap = snapshot.docs[0];
      // Increment view count (best-effort)
      try {
        await updateDoc(docSnap.ref, { 'stats.views': increment(1) });
      } catch {}
      const data: any = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
      } as Article;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch article by slug');
    }
  }

  // Get articles with pagination
  async getArticles({ 
    limit: limitCount = 20, 
    category, 
    lastDoc 
  }: { 
    limit?: number; 
    category?: string; 
    lastDoc?: any;
  } = {}): Promise<{ articles: Article[]; hasMore: boolean; lastDoc: any }> {
    try {
      let q = query(
        this.articlesCollection,
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );

      if (category) {
        q = query(
          this.articlesCollection,
          where('category', '==', category),
          orderBy('lastUpdated', 'desc'),
          limit(limitCount)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const articles: Article[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastUpdated: data.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
        } as Article);
      });

      const hasMore = querySnapshot.docs.length === limitCount;
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { articles, hasMore, lastDoc: newLastDoc };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch articles');
    }
  }

  // Get recent articles (latest edited)
  async getRecentArticles(limitCount: number = 10): Promise<Article[]> {
    try {
      const q = query(
        this.articlesCollection,
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const articles: Article[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastUpdated: data.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
        } as Article);
      });

      return articles;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch recent articles');
    }
  }

  // Get popular articles
  async getPopularArticles(limitCount: number = 10): Promise<Article[]> {
    try {
      const q = query(
        this.articlesCollection,
        orderBy('stats.entries', 'desc'),
        orderBy('stats.likes', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const articles: Article[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as Article);
      });

      return articles;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch popular articles');
    }
  }

  // Get popular articles based on entries in the last 24 hours
  async getPopularArticlesLast24h(limitCount: number = 10): Promise<{ articles: Article[]; counts: Record<string, number> }> {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const entriesCol = collection(db, 'entries');
      // Firestore requires an orderBy on the same field as the inequality
      const q = query(entriesCol, where('createdAt', '>=', Timestamp.fromDate(since)), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const counts: Record<string, number> = {};
      snapshot.forEach((d) => {
        const data: any = d.data();
        const articleId: string | undefined = data?.articleId;
        if (articleId) counts[articleId] = (counts[articleId] || 0) + 1;
      });

      const sortedIds = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, limitCount);

      const articleDocs = await Promise.all(sortedIds.map((id) => getDoc(doc(db, 'articles', id))));
      const articles: Article[] = [];
      articleDocs.forEach((docSnap) => {
        if (docSnap.exists()) {
          const data: any = docSnap.data();
          articles.push({
            id: docSnap.id,
            ...data,
            createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
            lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
          } as Article);
        }
      });

      // preserve sorted order
      const idToArticle: Record<string, Article> = Object.fromEntries(articles.map((a) => [a.id, a]));
      const orderedArticles = sortedIds.map((id) => idToArticle[id]).filter(Boolean) as Article[];
      return { articles: orderedArticles, counts };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch 24h popular articles');
    }
  }

  // Update article
  async updateArticle(articleId: string, updates: Partial<Article>): Promise<Article> {
    try {
      const docRef = doc(db, 'articles', articleId);
      
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastUpdated: data?.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
      } as Article;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update article');
    }
  }

  // Delete article
  async deleteArticle(articleId: string): Promise<void> {
    try {
      const docRef = doc(db, 'articles', articleId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete article');
    }
  }

  // Search articles
  async searchArticles(searchQuery: string, filters?: { category?: string }): Promise<Article[]> {
    try {
      // Note: This is a basic search. For more advanced search, consider using Algolia or similar
      let q = query(
        this.articlesCollection,
        orderBy('title'),
        limit(20)
      );

      if (filters?.category) {
        q = query(
          this.articlesCollection,
          where('category', '==', filters.category),
          orderBy('title'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      const articles: Article[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const article = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastUpdated: data.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
        } as Article;

        // Client-side filtering by title (case-insensitive)
        if (article.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          articles.push(article);
        }
      });

      return articles;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search articles');
    }
  }

  // Report article
  async reportArticle(articleId: string, userId: string, reason: string): Promise<void> {
    try {
      const docRef = doc(db, 'articles', articleId);
      await this.updateArticleStats(articleId, { reports: 1 } as any);
      try {
        await addDoc(collection(db, 'reports'), {
          articleId,
          reportedBy: userId,
          reason,
          createdAt: serverTimestamp(),
          status: 'pending',
          type: 'article',
        });
      } catch {}
    } catch (error: any) {
      throw new Error(error.message || 'Failed to report article');
    }
  }

  // Update article stats
  async updateArticleStats(articleId: string, stats: Partial<Article['stats']>): Promise<void> {
    try {
      const docRef = doc(db, 'articles', articleId);
      const updateData: any = {};

      if (stats.entries !== undefined) {
        updateData['stats.entries'] = increment(stats.entries);
        updateData['lastUpdated'] = serverTimestamp();
      }
      if (stats.likes !== undefined) {
        updateData['stats.likes'] = increment(stats.likes);
      }
      if (stats.views !== undefined) {
        updateData['stats.views'] = increment(stats.views);
      }
      if ((stats as any).reports !== undefined) {
        updateData['stats.reports'] = increment((stats as any).reports);
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update article stats');
    }
  }

  // Create URL-friendly slug
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim(); // Remove leading/trailing spaces
  }

  // Get articles by user
  async getArticlesByUser(userId: string, limitCount: number = 20): Promise<Article[]> {
    try {
      const q = query(
        this.articlesCollection,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const articles: Article[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          lastUpdated: data.lastUpdated?.toDate()?.toISOString() || new Date().toISOString(),
        } as Article);
      });

      return articles;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user articles');
    }
  }
}

export const articlesService = new ArticlesService();
