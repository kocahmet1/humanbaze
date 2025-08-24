import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Article } from '../../types';
import { articlesService } from '../../services/articles';

interface ArticlesState {
  articles: Article[];
  currentArticle: Article | null;
  recentArticles: Article[];
  popularArticles: Article[];
  popularArticles24h: Article[];
  popularCounts24h: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: any; // Firestore document snapshot
}

const initialState: ArticlesState = {
  articles: [],
  currentArticle: null,
  recentArticles: [],
  popularArticles: [],
  popularArticles24h: [],
  popularCounts24h: {},
  isLoading: false,
  error: null,
  hasMore: true,
  lastDoc: null,
};

// Async thunks
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async ({ limit = 20, category }: { limit?: number; category?: string } = {}) => {
    return await articlesService.getArticles({ limit, category });
  }
);

export const fetchArticleById = createAsyncThunk(
  'articles/fetchArticleById',
  async (articleId: string) => {
    return await articlesService.getArticleById(articleId);
  }
);

export const fetchArticleBySlug = createAsyncThunk(
  'articles/fetchArticleBySlug',
  async (slug: string) => {
    return await articlesService.getArticleBySlug(slug);
  }
);

export const fetchRecentArticles = createAsyncThunk(
  'articles/fetchRecentArticles',
  async (limit: number = 10) => {
    return await articlesService.getRecentArticles(limit);
  }
);

export const fetchPopularArticles = createAsyncThunk(
  'articles/fetchPopularArticles',
  async (limit: number = 10) => {
    return await articlesService.getPopularArticles(limit);
  }
);

export const fetchPopularArticlesLast24h = createAsyncThunk(
  'articles/fetchPopularArticlesLast24h',
  async (limit: number = 10) => {
    return await articlesService.getPopularArticlesLast24h(limit);
  }
);

export const createArticle = createAsyncThunk(
  'articles/createArticle',
  async (articleData: Omit<Article, 'id' | 'createdAt' | 'lastUpdated' | 'stats'>) => {
    return await articlesService.createArticle(articleData);
  }
);

export const updateArticle = createAsyncThunk(
  'articles/updateArticle',
  async ({ articleId, updates }: { articleId: string; updates: Partial<Article> }) => {
    return await articlesService.updateArticle(articleId, updates);
  }
);

export const deleteArticle = createAsyncThunk(
  'articles/deleteArticle',
  async (articleId: string) => {
    await articlesService.deleteArticle(articleId);
    return articleId;
  }
);

export const searchArticles = createAsyncThunk(
  'articles/searchArticles',
  async ({ query, category }: { query: string; category?: string }) => {
    return await articlesService.searchArticles(query, { category });
  }
);

export const reportArticle = createAsyncThunk(
  'articles/reportArticle',
  async ({ articleId, userId, reason }: { articleId: string; userId: string; reason: string }) => {
    await articlesService.reportArticle(articleId, userId, reason);
    return { articleId };
  }
);

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentArticle: (state) => {
      state.currentArticle = null;
    },
    updateArticleStats: (state, action: PayloadAction<{ articleId: string; stats: Partial<Article['stats']> }>) => {
      const { articleId, stats } = action.payload;
      
      // Update in articles array
      const articleIndex = state.articles.findIndex(a => a.id === articleId);
      if (articleIndex !== -1) {
        state.articles[articleIndex].stats = { ...state.articles[articleIndex].stats, ...stats };
      }
      
      // Update current article
      if (state.currentArticle?.id === articleId) {
        state.currentArticle.stats = { ...state.currentArticle.stats, ...stats };
      }
      
      // Update in recent articles
      const recentIndex = state.recentArticles.findIndex(a => a.id === articleId);
      if (recentIndex !== -1) {
        state.recentArticles[recentIndex].stats = { ...state.recentArticles[recentIndex].stats, ...stats };
      }
      
      // Update in popular articles
      const popularIndex = state.popularArticles.findIndex(a => a.id === articleId);
      if (popularIndex !== -1) {
        state.popularArticles[popularIndex].stats = { ...state.popularArticles[popularIndex].stats, ...stats };
      }
    },
    resetArticles: (state) => {
      state.articles = [];
      state.hasMore = true;
      state.lastDoc = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch articles
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload.articles;
        state.hasMore = action.payload.hasMore;
        state.lastDoc = action.payload.lastDoc;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch articles';
      });

    // Fetch article by ID
    builder
      .addCase(fetchArticleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentArticle = action.payload;
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch article';
      });

    // Fetch article by Slug
    builder
      .addCase(fetchArticleBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchArticleBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentArticle = action.payload;
      })
      .addCase(fetchArticleBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch article';
      });

    // Fetch recent articles
    builder
      .addCase(fetchRecentArticles.fulfilled, (state, action) => {
        state.recentArticles = action.payload;
      });

    // Fetch popular articles
    builder
      .addCase(fetchPopularArticles.fulfilled, (state, action) => {
        state.popularArticles = action.payload;
      });

    // Fetch popular articles last 24h
    builder.addCase(fetchPopularArticlesLast24h.fulfilled, (state, action) => {
      state.popularArticles24h = action.payload.articles;
      state.popularCounts24h = action.payload.counts;
    });

    // Create article
    builder
      .addCase(createArticle.fulfilled, (state, action) => {
        state.articles.unshift(action.payload);
        state.recentArticles.unshift(action.payload);
      });

    // Update article
    builder
      .addCase(updateArticle.fulfilled, (state, action) => {
        const updatedArticle = action.payload;
        
        // Update in articles array
        const articleIndex = state.articles.findIndex(a => a.id === updatedArticle.id);
        if (articleIndex !== -1) {
          state.articles[articleIndex] = updatedArticle;
        }
        
        // Update current article
        if (state.currentArticle?.id === updatedArticle.id) {
          state.currentArticle = updatedArticle;
        }
      });

    // Delete article
    builder
      .addCase(deleteArticle.fulfilled, (state, action) => {
        const articleId = action.payload;
        state.articles = state.articles.filter(a => a.id !== articleId);
        state.recentArticles = state.recentArticles.filter(a => a.id !== articleId);
        state.popularArticles = state.popularArticles.filter(a => a.id !== articleId);
        
        if (state.currentArticle?.id === articleId) {
          state.currentArticle = null;
        }
      });

    // Search articles
    builder
      .addCase(searchArticles.fulfilled, (state, action) => {
        state.articles = action.payload;
      });
  },
});

export const { clearError, clearCurrentArticle, updateArticleStats, resetArticles } = articlesSlice.actions;
export default articlesSlice.reducer;
