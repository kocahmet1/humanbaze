import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import articlesReducer from './slices/articlesSlice';
import entriesReducer from './slices/entriesSlice';
import usersReducer from './slices/usersSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    entries: entriesReducer,
    users: usersReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.lastActive',
          'entries.lastDoc',
          'articles.lastDoc',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
