import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeMode } from './ThemeProvider';
import { theme } from '../styles/theme';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useThemeMode();

  return (
    <TouchableOpacity onPress={toggleMode} style={styles.container} accessibilityRole="button" accessibilityLabel="Toggle dark mode">
      <Text style={[styles.sideLabel, mode === 'light' && styles.activeLabel]}>Light mode</Text>
      <View style={[styles.switch, mode === 'dark' ? styles.switchOn : styles.switchOff]}>
        <View style={[styles.knob, mode === 'dark' ? styles.knobOn : styles.knobOff]} />
      </View>
      <Text style={[styles.sideLabel, mode === 'dark' && styles.activeLabel]}>Dark mode</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  sideLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  activeLabel: {
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 9999,
    justifyContent: 'center',
    padding: 2,
  },
  switchOff: {
    backgroundColor: theme.colors.overlay,
  },
  switchOn: {
    backgroundColor: theme.colors.primary,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: theme.colors.surface,
  },
  knobOff: {
    transform: [{ translateX: 0 }],
  },
  knobOn: {
    transform: [{ translateX: 20 }],
  },
});


