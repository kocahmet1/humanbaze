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
    | { name: 'article'; articleId: string }
    | { name: 'profile' }
    | { name: 'userProfile'; userId: string }
    | { name: 'admin' }
    | { name: 'settings' }
  >(() => {
    const hash = window.location.hash || '';
    const articleMatch = hash.match(/#\/article\/(.+)$/);
    const profileMatch = hash.match(/#\/profile\/(.+)$/);
    
    if (articleMatch) return { name: 'article', articleId: decodeURIComponent(articleMatch[1]) };
    if (profileMatch) return { name: 'userProfile', userId: decodeURIComponent(profileMatch[1]) };
    if (hash === '#/profile') return { name: 'profile' };
    if (hash === '#/admin') return { name: 'admin' };
    if (hash === '#/settings') return { name: 'settings' };
    return { name: 'home' };
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash || '';
      const articleMatch = hash.match(/#\/article\/(.+)$/);
      const profileMatch = hash.match(/#\/profile\/(.+)$/);
      
      if (articleMatch) setRoute({ name: 'article', articleId: decodeURIComponent(articleMatch[1]) });
      else if (profileMatch) setRoute({ name: 'userProfile', userId: decodeURIComponent(profileMatch[1]) });
      else if (hash === '#/profile') setRoute({ name: 'profile' });
      else if (hash === '#/admin') setRoute({ name: 'admin' });
      else if (hash === '#/settings') setRoute({ name: 'settings' });
      else setRoute({ name: 'home' });
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
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
          <ArticleDetailScreen articleId={route.articleId} />
        ) : route.name === 'profile' ? (
          <ProfileScreen />
        ) : route.name === 'userProfile' ? (
          React.createElement(UserProfileScreen, { userId: route.userId })
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
