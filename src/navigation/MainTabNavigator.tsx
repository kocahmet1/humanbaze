import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text } from 'react-native';
import { RootState } from '../store';
import { theme } from '../styles/theme';
import { MainTabParamList } from '../types';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import icons (you'll need to implement these)
import { HomeIcon, DiscoverIcon, CreateIcon, ProfileIcon } from '../components/icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const { isMobile } = useSelector((state: RootState) => state.ui);

  if (!isMobile) {
    // For web/desktop, we'll use a different layout
    return <HomeScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarLabelStyle: {
          fontSize: theme.fonts.sizes.xs,
          fontWeight: theme.fonts.weights.medium,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <DiscoverIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CreateIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
