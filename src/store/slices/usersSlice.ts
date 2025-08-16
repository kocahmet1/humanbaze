import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Follow } from '../../types';
import { usersService } from '../../services/users';

interface UsersState {
  users: User[];
  leaderboard: Array<User & { leaderboardValue?: number }>;
  searchResults: User[];
  currentProfile: User | null;
  followers: User[];
  following: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  leaderboard: [],
  searchResults: [],
  currentProfile: null,
  followers: [],
  following: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId: string) => {
    return await usersService.getUserById(userId);
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'users/fetchLeaderboard',
  async ({ period = 'recent_creators', limit = 10 }: { period?: 'recent_creators' | 'top_likes_24h'; limit?: number } = {}) => {
    return await usersService.getLeaderboard(period, limit);
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query: string) => {
    return await usersService.searchUsers(query);
  }
);

export const followUser = createAsyncThunk(
  'users/followUser',
  async ({ followerId, followingId }: { followerId: string; followingId: string }) => {
    return await usersService.followUser(followerId, followingId);
  }
);

export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async ({ followerId, followingId }: { followerId: string; followingId: string }) => {
    await usersService.unfollowUser(followerId, followingId);
    return { followerId, followingId };
  }
);

export const fetchFollowers = createAsyncThunk(
  'users/fetchFollowers',
  async (userId: string) => {
    return await usersService.getFollowers(userId);
  }
);

export const fetchFollowing = createAsyncThunk(
  'users/fetchFollowing',
  async (userId: string) => {
    return await usersService.getFollowing(userId);
  }
);

export const updateUserProfile = createAsyncThunk(
  'users/updateUserProfile',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
    return await usersService.updateUserProfile(userId, updates);
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  'users/uploadProfilePhoto',
  async ({ userId, file }: { userId: string; file: File }) => {
    return await usersService.uploadProfilePhoto(userId, file);
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
    },
    updateUserInLists: (state, action: PayloadAction<User>) => {
      const updatedUser = action.payload;
      
      // Update in users array
      const userIndex = state.users.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) {
        state.users[userIndex] = updatedUser;
      }
      
      // Update in leaderboard
      const leaderboardIndex = state.leaderboard.findIndex(u => u.id === updatedUser.id);
      if (leaderboardIndex !== -1) {
        const previousValue = state.leaderboard[leaderboardIndex].leaderboardValue;
        state.leaderboard[leaderboardIndex] = { ...updatedUser, leaderboardValue: previousValue };
      }
      
      // Update current profile
      if (state.currentProfile?.id === updatedUser.id) {
        state.currentProfile = updatedUser;
      }
    },
    updateFollowStatus: (state, action: PayloadAction<{
      followerId: string;
      followingId: string;
      isFollowing: boolean;
    }>) => {
      const { followerId, followingId, isFollowing } = action.payload;
      
      // Update follow counts in users
      const updateUserStats = (user: User) => {
        if (user.id === followerId) {
          user.stats.following += isFollowing ? 1 : -1;
        }
        if (user.id === followingId) {
          user.stats.followers += isFollowing ? 1 : -1;
        }
      };
      
      state.users.forEach(updateUserStats);
      state.leaderboard.forEach(updateUserStats);
      
      if (state.currentProfile) {
        updateUserStats(state.currentProfile);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user';
      });

    // Fetch leaderboard
    builder
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      });

    // Search users
    builder
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });

    // Follow user
    builder
      .addCase(followUser.fulfilled, (state, action) => {
        const follow = action.payload;
        
        // Update follow counts
        const updateStats = (user: User) => {
          if (user.id === follow.followerId) {
            user.stats.following += 1;
          }
          if (user.id === follow.followingId) {
            user.stats.followers += 1;
          }
        };
        
        state.users.forEach(updateStats);
        state.leaderboard.forEach(updateStats);
        
        if (state.currentProfile) {
          updateStats(state.currentProfile);
        }
      });

    // Unfollow user
    builder
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { followerId, followingId } = action.payload;
        
        // Update follow counts
        const updateStats = (user: User) => {
          if (user.id === followerId) {
            user.stats.following -= 1;
          }
          if (user.id === followingId) {
            user.stats.followers -= 1;
          }
        };
        
        state.users.forEach(updateStats);
        state.leaderboard.forEach(updateStats);
        
        if (state.currentProfile) {
          updateStats(state.currentProfile);
        }
      });

    // Fetch followers
    builder
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      });

    // Fetch following
    builder
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.following = action.payload;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        
        // Update in all arrays
        const updateUser = (user: User) => {
          if (user.id === updatedUser.id) {
            return updatedUser;
          }
          return user;
        };
        
        state.users = state.users.map(updateUser);
        state.leaderboard = state.leaderboard.map(updateUser);
        state.followers = state.followers.map(updateUser);
        state.following = state.following.map(updateUser);
        
        if (state.currentProfile?.id === updatedUser.id) {
          state.currentProfile = updatedUser;
        }
      });

    // Upload profile photo
    builder
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        const { userId, photoURL } = action.payload;
        
        // Update photo URL in all arrays
        const updatePhoto = (user: User) => {
          if (user.id === userId) {
            user.photoURL = photoURL;
          }
        };
        
        state.users.forEach(updatePhoto);
        state.leaderboard.forEach(updatePhoto);
        state.followers.forEach(updatePhoto);
        state.following.forEach(updatePhoto);
        
        if (state.currentProfile?.id === userId) {
          state.currentProfile.photoURL = photoURL;
        }
      });
  },
});

export const { 
  clearError, 
  clearSearchResults, 
  clearCurrentProfile, 
  updateUserInLists, 
  updateFollowStatus 
} = usersSlice.actions;
export default usersSlice.reducer;
