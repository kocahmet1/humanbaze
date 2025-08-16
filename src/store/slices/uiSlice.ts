import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isNavigationExpanded: boolean;
  activeNavItem: 'latest' | 'popular' | 'following' | 'channels';
  isMobile: boolean;
  isTablet: boolean;
  searchQuery: string;
  searchResults: {
    isVisible: boolean;
    isLoading: boolean;
  };
  modals: {
    login: boolean;
    register: boolean;
    createArticle: boolean;
    followers: boolean;
    following: boolean;
    settings: boolean;
    report: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;
  theme: 'light' | 'dark';
  leaderboardPeriod: 'recent_creators' | 'top_likes_24h';
}

const initialState: UIState = {
  isNavigationExpanded: false,
  activeNavItem: 'latest',
  isMobile: false,
  isTablet: false,
  searchQuery: '',
  searchResults: {
    isVisible: false,
    isLoading: false,
  },
  modals: {
    login: false,
    register: false,
    createArticle: false,
    followers: false,
    following: false,
    settings: false,
    report: false,
  },
  notifications: [],
  theme: 'light',
  leaderboardPeriod: 'recent_creators',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setNavigationExpanded: (state, action: PayloadAction<boolean>) => {
      state.isNavigationExpanded = action.payload;
    },
    setActiveNavItem: (state, action: PayloadAction<UIState['activeNavItem']>) => {
      state.activeNavItem = action.payload;
    },
    setScreenSize: (state, action: PayloadAction<{ isMobile: boolean; isTablet: boolean }>) => {
      state.isMobile = action.payload.isMobile;
      state.isTablet = action.payload.isTablet;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchResultsVisible: (state, action: PayloadAction<boolean>) => {
      state.searchResults.isVisible = action.payload;
    },
    setSearchResultsLoading: (state, action: PayloadAction<boolean>) => {
      state.searchResults.isLoading = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLeaderboardPeriod: (state, action: PayloadAction<'recent_creators' | 'top_likes_24h'>) => {
      state.leaderboardPeriod = action.payload;
    },
    toggleNavigation: (state) => {
      state.isNavigationExpanded = !state.isNavigationExpanded;
    },
  },
});

export const {
  setNavigationExpanded,
  setActiveNavItem,
  setScreenSize,
  setSearchQuery,
  setSearchResultsVisible,
  setSearchResultsLoading,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setLeaderboardPeriod,
  toggleNavigation,
} = uiSlice.actions;

export default uiSlice.reducer;
