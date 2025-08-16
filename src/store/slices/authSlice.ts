import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { authService } from '../../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }) => {
    return await authService.loginWithEmail(email, password);
  }
);

export const registerWithEmail = createAsyncThunk(
  'auth/registerWithEmail',
  async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
    return await authService.registerWithEmail(email, password, displayName);
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async () => {
    return await authService.loginWithGoogle();
  }
);

export const loginWithFacebook = createAsyncThunk(
  'auth/loginWithFacebook',
  async () => {
    return await authService.loginWithFacebook();
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async () => {
    return await authService.getCurrentUser();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    setInitialized: (state) => {
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserStats: (state, action: PayloadAction<Partial<User['stats']>>) => {
      if (state.user) {
        state.user.stats = { ...state.user.stats, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login with email
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Register with email
    builder
      .addCase(registerWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      });

    // Login with Google
    builder
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      });

    // Login with Facebook
    builder
      .addCase(loginWithFacebook.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });

    // Check auth state
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuthState.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, clearError, updateUserStats } = authSlice.actions;
export default authSlice.reducer;
