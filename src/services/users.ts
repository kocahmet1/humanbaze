import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { User, Follow } from '../types';

class UsersService {
  private usersCollection = collection(db, 'users');
  private followsCollection = collection(db, 'follows');

  // Get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('User not found');
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        lastActive: data.lastActive?.toDate()?.toISOString() || new Date().toISOString(),
      } as User;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  }

  // Get user by slug
  async getUserBySlug(slug: string): Promise<User> {
    try {
      const qRef = query(this.usersCollection, where('slug', '==', slug), limit(1));
      const snapshot = await getDocs(qRef);
      if (snapshot.empty) {
        throw new Error('User not found');
      }
      const docSnap = snapshot.docs[0];
      const data: any = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
        lastActive: data?.lastActive?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      } as User;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user by slug');
    }
  }

  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Ensures a user has a unique slug; updates doc if missing
  async ensureUserSlug(userId: string, displayName: string): Promise<string> {
    const base = this.createSlug(displayName || 'user');
    let candidate = base || `user-${userId.slice(0,6)}`;
    // Check availability
    const exists = async (slug: string) => {
      const snap = await getDocs(query(this.usersCollection, where('slug', '==', slug), limit(1)));
      return !snap.empty;
    };
    let suffix = 0;
    let finalSlug = candidate;
    while (await exists(finalSlug)) {
      suffix += 1;
      finalSlug = `${candidate}-${suffix}`;
    }
    await updateDoc(doc(db, 'users', userId), { slug: finalSlug, lastActive: serverTimestamp() });
    return finalSlug;
  }

  // Get leaderboard
  // Note: This now returns different datasets based on mode:
  // - 'recent_creators': last 10 unique users who created entries most recently
  // - 'top_likes_24h': top 10 users ranked by likes received on entries created within the last 24h
  async getLeaderboard(mode: 'recent_creators' | 'top_likes_24h' = 'recent_creators', limitCount: number = 10): Promise<Array<User & { leaderboardValue?: number }>> {
    try {
      if (mode === 'recent_creators') {
        // We need the last N entries, then dedupe by user preserving order
        const entriesCol = collection(db, 'entries');
        let qRecent: any;
        try {
          qRecent = query(entriesCol, orderBy('createdAt', 'desc'), limit(100));
        } catch {
          qRecent = query(entriesCol, limit(100));
        }
        const entriesSnap = await getDocs(qRecent);
        const seen = new Set<string>();
        const userIds: string[] = [];
        entriesSnap.forEach(d => {
          const data: any = d.data();
          const uid = data.userId as string;
          if (uid && !seen.has(uid)) {
            seen.add(uid);
            userIds.push(uid);
          }
        });
        const picked = userIds.slice(0, limitCount);
        if (picked.length === 0) return [];
        // Fetch users by IDs and preserve order
        const users: User[] = [];
        for (const uid of picked) {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const udata = userSnap.data();
            users.push({
              id: userSnap.id,
              ...udata,
              createdAt: (udata as any).createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              lastActive: (udata as any).lastActive?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              leaderboardValue: undefined,
            } as User & { leaderboardValue?: number });
          }
        }
        return users;
      }

      // mode === 'top_likes_24h'
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const entriesCol = collection(db, 'entries');
      let qLikes: any;
      try {
        // Prefer createdAt filter if available
        qLikes = query(entriesCol, where('createdAt', '>=', Timestamp.fromDate(start)), limit(500));
      } catch {
        qLikes = query(entriesCol, limit(500));
      }
      const entriesSnap = await getDocs(qLikes);
      const likesByUser = new Map<string, number>();
      entriesSnap.forEach(d => {
        const data: any = d.data();
        const created = data.createdAt?.toDate?.() || data.createdAt;
        const createdDate = created instanceof Date ? created : new Date(created);
        if (createdDate >= start) {
          const uid = data.userId as string;
          const likes = Number(data?.stats?.likes || 0);
          likesByUser.set(uid, (likesByUser.get(uid) || 0) + likes);
        }
      });
      const sorted = Array.from(likesByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([uid]) => uid);
      const users: Array<User & { leaderboardValue?: number }> = [];
      for (const uid of sorted) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const udata = userSnap.data();
          users.push({
            id: userSnap.id,
            ...udata,
            createdAt: (udata as any).createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            lastActive: (udata as any).lastActive?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            leaderboardValue: (likesByUser.get(uid) || 0),
          } as User & { leaderboardValue?: number });
        }
      }
      return users;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch leaderboard');
    }
  }

  // Search users
  async searchUsers(searchQuery: string): Promise<User[]> {
    try {
      // Note: This is a basic search. For production, consider using Algolia or similar
      const q = query(
        this.usersCollection,
        orderBy('displayName'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const user = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
        } as User;

        // Client-side filtering (case-insensitive)
        if (
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          users.push(user);
        }
      });

      return users;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search users');
    }
  }

  // Follow user
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    try {
      // Check if already following
      const existingFollow = await getDocs(
        query(
          this.followsCollection,
          where('followerId', '==', followerId),
          where('followingId', '==', followingId)
        )
      );

      if (!existingFollow.empty) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      const followData = {
        followerId,
        followingId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.followsCollection, followData);

      // Update follower/following counts
      await this.updateFollowCounts(followerId, followingId, 1);

      return {
        id: docRef.id,
        ...followData,
        createdAt: new Date(),
      } as Follow;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to follow user');
    }
  }

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Find and delete follow relationship
      const followQuery = query(
        this.followsCollection,
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );

      const followSnapshot = await getDocs(followQuery);
      
      if (followSnapshot.empty) {
        throw new Error('Not following this user');
      }

      // Delete follow document
      const followDoc = followSnapshot.docs[0];
      await deleteDoc(followDoc.ref);

      // Update follower/following counts
      await this.updateFollowCounts(followerId, followingId, -1);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unfollow user');
    }
  }

  // Get followers
  async getFollowers(userId: string): Promise<User[]> {
    try {
      // Get follow relationships where this user is being followed
      const followsQuery = query(
        this.followsCollection,
        where('followingId', '==', userId)
      );

      const followsSnapshot = await getDocs(followsQuery);
      const followerIds: string[] = [];

      followsSnapshot.forEach((doc) => {
        followerIds.push(doc.data().followerId);
      });

      if (followerIds.length === 0) {
        return [];
      }

      // Get user documents for followers
      const followers: User[] = [];
      for (const followerId of followerIds) {
        try {
          const user = await this.getUserById(followerId);
          followers.push(user);
        } catch (error) {
          // Skip if user not found
          console.warn(`Follower ${followerId} not found`);
        }
      }

      return followers;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch followers');
    }
  }

  // Get following
  async getFollowing(userId: string): Promise<User[]> {
    try {
      // Get follow relationships where this user is following others
      const followsQuery = query(
        this.followsCollection,
        where('followerId', '==', userId)
      );

      const followsSnapshot = await getDocs(followsQuery);
      const followingIds: string[] = [];

      followsSnapshot.forEach((doc) => {
        followingIds.push(doc.data().followingId);
      });

      if (followingIds.length === 0) {
        return [];
      }

      // Get user documents for following
      const following: User[] = [];
      for (const followingId of followingIds) {
        try {
          const user = await this.getUserById(followingId);
          following.push(user);
        } catch (error) {
          // Skip if user not found
          console.warn(`Following user ${followingId} not found`);
        }
      }

      return following;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch following');
    }
  }

  // Check if user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followQuery = query(
        this.followsCollection,
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );

      const followSnapshot = await getDocs(followQuery);
      return !followSnapshot.empty;
    } catch (error: any) {
      return false;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = doc(db, 'users', userId);
      // If displayName is being set and slug missing, set slug (do not overwrite existing slug)
      if (updates.displayName) {
        const current = await getDoc(userRef);
        const data: any = current.data();
        if (!data?.slug) {
          await this.ensureUserSlug(userId, updates.displayName);
        }
      }
      await updateDoc(userRef, { ...updates, lastActive: serverTimestamp() });
      return await this.getUserById(userId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(userId: string, file: File): Promise<{ userId: string; photoURL: string }> {
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile-photos/${userId}/${Date.now()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const photoURL = await getDownloadURL(snapshot.ref);
      
      // Update user document with new photo URL
      await updateDoc(doc(db, 'users', userId), {
        photoURL,
        lastActive: serverTimestamp(),
      });

      return { userId, photoURL };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload profile photo');
    }
  }

  // Update user stats
  async updateUserStats(userId: string, stats: Partial<User['stats']>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      const updateData: any = {};

      if (stats.entries !== undefined) {
        updateData['stats.entries'] = stats.entries;
      }
      if (stats.points !== undefined) {
        updateData['stats.points'] = stats.points;
      }
      if (stats.followers !== undefined) {
        updateData['stats.followers'] = stats.followers;
      }
      if (stats.following !== undefined) {
        updateData['stats.following'] = stats.following;
      }

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user stats');
    }
  }

  // Private helper method to update follow counts
  private async updateFollowCounts(followerId: string, followingId: string, delta: number): Promise<void> {
    try {
      // Update follower's following count
      const followerRef = doc(db, 'users', followerId);
      const followerDoc = await getDoc(followerRef);
      if (followerDoc.exists()) {
        const currentFollowing = followerDoc.data().stats?.following || 0;
        await updateDoc(followerRef, {
          'stats.following': Math.max(0, currentFollowing + delta),
        });
      }

      // Update following user's followers count
      const followingRef = doc(db, 'users', followingId);
      const followingDoc = await getDoc(followingRef);
      if (followingDoc.exists()) {
        const currentFollowers = followingDoc.data().stats?.followers || 0;
        await updateDoc(followingRef, {
          'stats.followers': Math.max(0, currentFollowers + delta),
        });
      }
    } catch (error) {
      console.error('Failed to update follow counts:', error);
    }
  }
}

export const usersService = new UsersService();
