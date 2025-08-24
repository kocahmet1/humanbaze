import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { HomeScreen } from './screens/HomeScreen';
import { initializeFirebase } from './services/firebase';
import { authService } from './services/auth';
import { setUser } from './store/slices/authSlice';
import { theme } from './styles/theme';
import { ArticleDetailScreen } from './screens/ArticleDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { UserProfileScreen } from './screens/UserProfileScreen';
import { AdminScreen } from './screens/AdminScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { globalStyles } from './styles/globalStyles';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { CreateArticleModal } from './components/CreateArticleModal';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { setScreenSize } from './store/slices/uiSlice';

// Keeps ui.isMobile and ui.isTablet in sync with window width
function ScreenSizeListener() {
  const dispatch = useDispatch();
  useEffect(() => {
    const update = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const isMobile = w < theme.breakpoints.mobile;
      const isTablet = w >= theme.breakpoints.mobile && w < theme.breakpoints.desktop;
      dispatch(setScreenSize({ isMobile, isTablet }));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [dispatch]);
  return null;
}

// Initialize Firebase
initializeFirebase();

// Inject global styles for web
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = globalStyles;
  document.head.appendChild(styleElement);
}

const App: React.FC = () => {
  useEffect(() => {
    // Keep Redux in sync with Firebase auth across refreshes
    const unsubscribe = authService.onAuthStateChange((user) => {
      store.dispatch(setUser(user));
    });
    return unsubscribe;
  }, []);
  const [route, setRoute] = useState<
    | { name: 'home' }
    | { name: 'article'; articleSlug: string }
    | { name: 'articleById'; articleId: string }
    | { name: 'profile' }
    | { name: 'userProfile'; userId: string }
    | { name: 'userProfileBySlug'; userSlug: string }
    | { name: 'admin' }
    | { name: 'settings' }
  >(() => {
    const path = window.location.pathname || '/';
    const articleByIdMatch = path.match(/^\/article\/id\/(.+)$/);
    const articleSlugMatch = path.match(/^\/article\/([^/]+)$/);
    const profileUserMatch = path.match(/^\/profile\/(.+)$/);
    const profileSlugMatch = path.match(/^\/u\/([^/]+)$/);

    if (articleByIdMatch) return { name: 'articleById', articleId: decodeURIComponent(articleByIdMatch[1]) };
    if (articleSlugMatch) return { name: 'article', articleSlug: decodeURIComponent(articleSlugMatch[1]) };
    if (profileSlugMatch) return { name: 'userProfileBySlug', userSlug: decodeURIComponent(profileSlugMatch[1]) };
    if (profileUserMatch) return { name: 'userProfile', userId: decodeURIComponent(profileUserMatch[1]) };
    if (path === '/profile') return { name: 'profile' };
    if (path === '/admin') return { name: 'admin' };
    if (path === '/settings') return { name: 'settings' };
    return { name: 'home' };
  });

  useEffect(() => {
    const handler = () => {
      const path = window.location.pathname || '/';
      const articleByIdMatch = path.match(/^\/article\/id\/(.+)$/);
      const articleSlugMatch = path.match(/^\/article\/([^/]+)$/);
      const profileUserMatch = path.match(/^\/profile\/(.+)$/);
      const profileSlugMatch = path.match(/^\/u\/([^/]+)$/);

      if (articleByIdMatch) setRoute({ name: 'articleById', articleId: decodeURIComponent(articleByIdMatch[1]) });
      else if (articleSlugMatch) setRoute({ name: 'article', articleSlug: decodeURIComponent(articleSlugMatch[1]) });
      else if (profileSlugMatch) setRoute({ name: 'userProfileBySlug', userSlug: decodeURIComponent(profileSlugMatch[1]) });
      else if (profileUserMatch) setRoute({ name: 'userProfile', userId: decodeURIComponent(profileUserMatch[1]) });
      else if (path === '/profile') setRoute({ name: 'profile' });
      else if (path === '/admin') setRoute({ name: 'admin' });
      else if (path === '/settings') setRoute({ name: 'settings' });
      else setRoute({ name: 'home' });
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <ScreenSizeListener />
        <View style={styles.container}>
          <View style={styles.topBar}>
            <ThemeToggle />
          </View>
        {route.name === 'home' ? (
          <HomeScreen />
        ) : route.name === 'article' ? (
          <ArticleDetailScreen articleSlug={route.articleSlug} />
        ) : route.name === 'articleById' ? (
          <ArticleDetailScreen articleId={route.articleId} />
        ) : route.name === 'profile' ? (
          <ProfileScreen />
        ) : route.name === 'userProfile' ? (
          React.createElement(UserProfileScreen, { userId: route.userId })
        ) : route.name === 'userProfileBySlug' ? (
          React.createElement(UserProfileScreen, { userSlug: route.userSlug } as any)
        ) : route.name === 'admin' ? (
          <AdminScreen />
        ) : route.name === 'settings' ? (
          <SettingsScreen />
        ) : (
          <HomeScreen />
        )}
        {/* Global modals */}
        <LoginModal />
        <RegisterModal />
        <CreateArticleModal />
        </View>
      </ThemeProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    width: '100%',
    backgroundColor: theme.colors.navBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backdropFilter: 'blur(12px)',
    ...theme.shadows.sm,
  },
});

export default App;
