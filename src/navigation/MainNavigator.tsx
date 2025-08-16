import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { CreateArticleScreen } from '../screens/CreateArticleScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AdminScreen } from '../screens/AdminScreen';

export type MainStackParamList = {
  MainTabs: undefined;
  ArticleDetail: { articleId: string; entryId?: string };
  UserProfile: { userId: string };
  CreateArticle: undefined;
  Settings: undefined;
  Admin?: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="ArticleDetail" 
        component={ArticleDetailScreen}
        options={{
          headerShown: true,
          title: 'Article',
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="CreateArticle" 
        component={CreateArticleScreen}
        options={{
          headerShown: true,
          title: 'Create Article',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{
          headerShown: true,
          title: 'Admin',
        }}
      />
    </Stack.Navigator>
  );
};
