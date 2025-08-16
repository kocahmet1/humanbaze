import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Entry } from '../../types';
import { entriesService } from '../../services/entries';

interface EntriesState {
  entries: Entry[];
  feedEntries: Entry[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: any; // Firestore document snapshot
}

const initialState: EntriesState = {
  entries: [],
  feedEntries: [],
  isLoading: false,
  error: null,
  hasMore: true,
  lastDoc: null,
};

// Async thunks
export const fetchEntriesByArticleId = createAsyncThunk(
  'entries/fetchEntriesByArticleId',
  async ({ articleId, limit = 10, sortBy = 'recent' }: { 
    articleId: string; 
    limit?: number; 
    sortBy?: 'recent' | 'popular' | 'controversial';
  }) => {
    return await entriesService.getEntriesByArticleId(articleId, { limit, sortBy });
  }
);

export const fetchFeedEntries = createAsyncThunk(
  'entries/fetchFeedEntries',
  async ({ limit = 20, userId }: { limit?: number; userId?: string } = {}) => {
    return await entriesService.getFeedEntries({ limit, userId });
  }
);

export const createEntry = createAsyncThunk(
  'entries/createEntry',
  async (entryData: Omit<Entry, 'id' | 'createdAt' | 'stats' | 'interactions'>) => {
    return await entriesService.createEntry(entryData);
  }
);

export const updateEntry = createAsyncThunk(
  'entries/updateEntry',
  async ({ entryId, updates }: { entryId: string; updates: Partial<Entry> }) => {
    return await entriesService.updateEntry(entryId, updates);
  }
);

export const deleteEntry = createAsyncThunk(
  'entries/deleteEntry',
  async (entryId: string) => {
    await entriesService.deleteEntry(entryId);
    return entryId;
  }
);

export const likeEntry = createAsyncThunk(
  'entries/likeEntry',
  async ({ entryId, userId }: { entryId: string; userId: string }) => {
    return await entriesService.likeEntry(entryId, userId);
  }
);

export const dislikeEntry = createAsyncThunk(
  'entries/dislikeEntry',
  async ({ entryId, userId }: { entryId: string; userId: string }) => {
    return await entriesService.dislikeEntry(entryId, userId);
  }
);

export const removeLikeDislike = createAsyncThunk(
  'entries/removeLikeDislike',
  async ({ entryId, userId }: { entryId: string; userId: string }) => {
    return await entriesService.removeLikeDislike(entryId, userId);
  }
);

export const reportEntry = createAsyncThunk(
  'entries/reportEntry',
  async ({ entryId, userId, reason }: { entryId: string; userId: string; reason: string }) => {
    return await entriesService.reportEntry(entryId, userId, reason);
  }
);

const entriesSlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateEntryInteraction: (state, action: PayloadAction<{
      entryId: string;
      userId: string;
      type: 'like' | 'dislike' | 'remove';
    }>) => {
      const { entryId, userId, type } = action.payload;
      
      const updateEntry = (entry: Entry) => {
        if (entry.id === entryId) {
          // Remove user from all interaction arrays first
          entry.interactions.likes = entry.interactions.likes.filter(id => id !== userId);
          entry.interactions.dislikes = entry.interactions.dislikes.filter(id => id !== userId);
          
          // Add to appropriate array if not removing
          if (type === 'like') {
            entry.interactions.likes.push(userId);
          } else if (type === 'dislike') {
            entry.interactions.dislikes.push(userId);
          }
          
          // Update stats
          entry.stats.likes = entry.interactions.likes.length;
          entry.stats.dislikes = entry.interactions.dislikes.length;
        }
      };
      
      // Update in entries array
      state.entries.forEach(updateEntry);
      
      // Update in feed entries
      state.feedEntries.forEach(updateEntry);
    },
    resetEntries: (state) => {
      state.entries = [];
      state.hasMore = true;
      state.lastDoc = null;
    },
    resetFeedEntries: (state) => {
      state.feedEntries = [];
      state.hasMore = true;
      state.lastDoc = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch entries by article ID
    builder
      .addCase(fetchEntriesByArticleId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEntriesByArticleId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload.entries;
        state.hasMore = action.payload.hasMore;
        state.lastDoc = action.payload.lastDoc;
      })
      .addCase(fetchEntriesByArticleId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch entries';
      });

    // Fetch feed entries
    builder
      .addCase(fetchFeedEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeedEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feedEntries = action.payload.entries;
        state.hasMore = action.payload.hasMore;
        state.lastDoc = action.payload.lastDoc;
      })
      .addCase(fetchFeedEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch feed entries';
      });

    // Create entry
    builder
      .addCase(createEntry.fulfilled, (state, action) => {
        // Insert new entry at top if it belongs to current article or feed
        const newEntry = action.payload;
        state.entries.unshift(newEntry);
        state.feedEntries.unshift(newEntry);
      });

    // Update entry
    builder
      .addCase(updateEntry.fulfilled, (state, action) => {
        const updatedEntry = action.payload;
        
        // Update in entries array
        const entryIndex = state.entries.findIndex(e => e.id === updatedEntry.id);
        if (entryIndex !== -1) {
          state.entries[entryIndex] = updatedEntry;
        }
        
        // Update in feed entries
        const feedIndex = state.feedEntries.findIndex(e => e.id === updatedEntry.id);
        if (feedIndex !== -1) {
          state.feedEntries[feedIndex] = updatedEntry;
        }
      });

    // Delete entry
    builder
      .addCase(deleteEntry.fulfilled, (state, action) => {
        const entryId = action.payload;
        state.entries = state.entries.filter(e => e.id !== entryId);
        state.feedEntries = state.feedEntries.filter(e => e.id !== entryId);
      });

    // Like/dislike/remove interactions
    builder
      .addCase(likeEntry.fulfilled, (state, action) => {
        const updatedEntry = action.payload;
        
        // Update in both arrays
        const updateEntry = (entry: Entry) => {
          if (entry.id === updatedEntry.id) {
            entry.interactions = updatedEntry.interactions;
            entry.stats = updatedEntry.stats;
          }
        };
        
        state.entries.forEach(updateEntry);
        state.feedEntries.forEach(updateEntry);
      })
      .addCase(dislikeEntry.fulfilled, (state, action) => {
        const updatedEntry = action.payload;
        
        const updateEntry = (entry: Entry) => {
          if (entry.id === updatedEntry.id) {
            entry.interactions = updatedEntry.interactions;
            entry.stats = updatedEntry.stats;
          }
        };
        
        state.entries.forEach(updateEntry);
        state.feedEntries.forEach(updateEntry);
      })
      .addCase(removeLikeDislike.fulfilled, (state, action) => {
        const updatedEntry = action.payload;
        
        const updateEntry = (entry: Entry) => {
          if (entry.id === updatedEntry.id) {
            entry.interactions = updatedEntry.interactions;
            entry.stats = updatedEntry.stats;
          }
        };
        
        state.entries.forEach(updateEntry);
        state.feedEntries.forEach(updateEntry);
      });
  },
});

export const { 
  clearError, 
  updateEntryInteraction, 
  resetEntries, 
  resetFeedEntries 
} = entriesSlice.actions;
export default entriesSlice.reducer;
