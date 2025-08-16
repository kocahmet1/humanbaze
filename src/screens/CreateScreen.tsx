import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const CreateScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
});
