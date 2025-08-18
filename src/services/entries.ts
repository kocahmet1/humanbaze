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
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Entry } from '../types';
import { articlesService } from './articles';

// Helper to safely normalize Firestore Timestamp | Date | string to ISO string
const toIso = (value: any): string => {
  try {
    if (!value) return new Date().toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
    }
    return new Date(value).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

class EntriesService {
  private entriesCollection = collection(db, 'entries');

  // Create entry
  async createEntry(entryData: Omit<Entry, 'id' | 'createdAt' | 'stats' | 'interactions'>): Promise<Entry> {
    try {
      const now = serverTimestamp();
      const docRef = await addDoc(this.entriesCollection, {
        ...entryData,
        stats: {
          likes: 0,
          dislikes: 0,
          reports: 0,
        },
        interactions: {
          likes: [],
          dislikes: [],
          reports: [],
        },
        createdAt: now,
        updatedAt: now,
      });

      // Update article stats
      await articlesService.updateArticleStats(entryData.articleId, { entries: 1 });

      const newDoc = await getDoc(docRef);
      const data = newDoc.data();

      return {
        id: docRef.id,
        ...data,
        createdAt: toIso(data?.createdAt),
        updatedAt: toIso(data?.updatedAt),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create entry');
    }
  }

  // Get entries by article ID
  async getEntriesByArticleId(
    articleId: string,
    { limit: limitCount = 10, sortBy = 'recent', lastDoc }: {
      limit?: number;
      sortBy?: 'recent' | 'popular' | 'controversial';
      lastDoc?: any;
    } = {}
  ): Promise<{ entries: Entry[]; hasMore: boolean; lastDoc: any }> {
    try {
      let orderField = 'createdAt';
      let orderDirection: 'desc' | 'asc' = 'desc';

      switch (sortBy) {
        case 'popular':
          orderField = 'stats.likes';
          break;
        case 'controversial':
          orderField = 'stats.dislikes';
          break;
        default:
          orderField = 'createdAt';
      }

      let q = query(
        this.entriesCollection,
        where('articleId', '==', articleId),
        orderBy(orderField, orderDirection),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        // Fallback without orderBy (e.g., missing index). We'll sort client-side.
        const simple = query(
          this.entriesCollection,
          where('articleId', '==', articleId),
          limit(limitCount)
        );
        querySnapshot = await getDocs(simple);
      }

      const entries: Entry[] = [];
      querySnapshot.forEach((doc) => {
        const data: any = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString(),
        } as Entry);
      });

      // Client-side sort by createdAt desc if order wasn't applied
      entries.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const hasMore = querySnapshot.docs.length === limitCount;
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { entries, hasMore, lastDoc: newLastDoc };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch entries');
    }
  }

  // Get feed entries (recent entries across all articles)
  async getFeedEntries({ 
    limit: limitCount = 20, 
    userId, 
    lastDoc 
  }: { 
    limit?: number; 
    userId?: string; 
    lastDoc?: any;
  } = {}): Promise<{ entries: Entry[]; hasMore: boolean; lastDoc: any }> {
    try {
      let q: any;
      try {
        // Prefer ordering by likes desc, then recent
        q = query(
          this.entriesCollection,
          orderBy('stats.likes', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } catch {
        // Fallback to simple query if composite index is missing
        try {
          q = query(
            this.entriesCollection,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
        } catch {
          q = query(this.entriesCollection, limit(limitCount));
        }
      }

      if (userId) {
        // If userId provided, get entries from followed users
        // This would require a separate query to get followed users first
        // For now, we'll return all entries
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        // Fallback if the composite index is missing at read time
        try {
          const fallback = query(
            this.entriesCollection,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
          querySnapshot = await getDocs(fallback);
        } catch {
          const simple = query(this.entriesCollection, limit(limitCount));
          querySnapshot = await getDocs(simple);
        }
      }
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data: any = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString(),
        } as Entry);
      });

      // Ensure ordering: most likes first, tie-breaker by most recent
      entries.sort((a, b) => {
        const likeDiff = (b.stats?.likes || 0) - (a.stats?.likes || 0);
        if (likeDiff !== 0) return likeDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const hasMore = querySnapshot.docs.length === limitCount;
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { entries, hasMore, lastDoc: newLastDoc };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch feed entries');
    }
  }

  // Update entry
  async updateEntry(entryId: string, updates: Partial<Entry>): Promise<Entry> {
    try {
      const docRef = doc(db, 'entries', entryId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data?.updatedAt?.toDate()?.toISOString(),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update entry');
    }
  }

  // Delete entry
  async deleteEntry(entryId: string): Promise<void> {
    try {
      const docRef = doc(db, 'entries', entryId);
      const entryDoc = await getDoc(docRef);
      
      if (entryDoc.exists()) {
        const entryData = entryDoc.data();
        
        // Update article stats
        await articlesService.updateArticleStats(entryData.articleId, { entries: -1 });
        
        // Delete entry
        await deleteDoc(docRef);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete entry');
    }
  }

  // Like entry
  async likeEntry(entryId: string, userId: string): Promise<Entry> {
    try {
      const docRef = doc(db, 'entries', entryId);
      
      // Remove from dislikes if present, add to likes
      await updateDoc(docRef, {
        'interactions.likes': arrayUnion(userId),
        'interactions.dislikes': arrayRemove(userId),
      });

      // Update stats
      const entryDoc = await getDoc(docRef);
      const data = entryDoc.data();
      
      if (data) {
        const likesCount = data.interactions?.likes?.length || 0;
        const dislikesCount = data.interactions?.dislikes?.length || 0;
        
        await updateDoc(docRef, {
          'stats.likes': likesCount,
          'stats.dislikes': dislikesCount,
        });
      }

      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: updatedData?.updatedAt?.toDate()?.toISOString(),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to like entry');
    }
  }

  // Dislike entry
  async dislikeEntry(entryId: string, userId: string): Promise<Entry> {
    try {
      const docRef = doc(db, 'entries', entryId);
      
      // Remove from likes if present, add to dislikes
      await updateDoc(docRef, {
        'interactions.dislikes': arrayUnion(userId),
        'interactions.likes': arrayRemove(userId),
      });

      // Update stats
      const entryDoc = await getDoc(docRef);
      const data = entryDoc.data();
      
      if (data) {
        const likesCount = data.interactions?.likes?.length || 0;
        const dislikesCount = data.interactions?.dislikes?.length || 0;
        
        await updateDoc(docRef, {
          'stats.likes': likesCount,
          'stats.dislikes': dislikesCount,
        });
      }

      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: updatedData?.updatedAt?.toDate()?.toISOString(),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to dislike entry');
    }
  }

  // Remove like/dislike
  async removeLikeDislike(entryId: string, userId: string): Promise<Entry> {
    try {
      const docRef = doc(db, 'entries', entryId);
      
      // Remove from both arrays
      await updateDoc(docRef, {
        'interactions.likes': arrayRemove(userId),
        'interactions.dislikes': arrayRemove(userId),
      });

      // Update stats
      const entryDoc = await getDoc(docRef);
      const data = entryDoc.data();
      
      if (data) {
        const likesCount = data.interactions?.likes?.length || 0;
        const dislikesCount = data.interactions?.dislikes?.length || 0;
        
        await updateDoc(docRef, {
          'stats.likes': likesCount,
          'stats.dislikes': dislikesCount,
        });
      }

      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: updatedData?.updatedAt?.toDate()?.toISOString(),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove like/dislike');
    }
  }

  // Report entry
  async reportEntry(entryId: string, userId: string, reason: string): Promise<Entry> {
    try {
      const docRef = doc(db, 'entries', entryId);
      
      await updateDoc(docRef, {
        'interactions.reports': arrayUnion(userId),
        'stats.reports': increment(1),
      });

      // Create a report document for admin review
      const current = await getDoc(docRef);
      const currentData: any = current.data();
      try {
        await addDoc(collection(db, 'reports'), {
          entryId,
          articleId: currentData?.articleId,
          reportedBy: userId,
          reason,
          createdAt: serverTimestamp(),
          status: 'pending',
          type: 'entry',
        });
      } catch {}

      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate() || new Date(),
        updatedAt: updatedData?.updatedAt?.toDate(),
      } as Entry;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to report entry');
    }
  }

  // Get entries by user
  async getEntriesByUser(userId: string, limitCount: number = 20): Promise<Entry[]> {
    try {
      const q = query(
        this.entriesCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString(),
        } as Entry);
      });

      return entries;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user entries');
    }
  }

  // Get most liked entries by user
  async getMostLikedEntriesByUser(userId: string, limitCount: number = 5): Promise<Entry[]> {
    try {
      const q = query(
        this.entriesCollection,
        where('userId', '==', userId),
        orderBy('stats.likes', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: Entry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString(),
        } as Entry);
      });

      return entries;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch most liked entries');
    }
  }
}

export const entriesService = new EntriesService();
