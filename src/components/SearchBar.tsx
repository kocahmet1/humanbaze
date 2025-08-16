import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setSearchQuery, setSearchResultsVisible } from '../store/slices/uiSlice';
import { theme } from '../styles/theme';

interface SearchBarProps {
  showSlogan?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ showSlogan = false }) => {
  const dispatch = useDispatch();
  const { searchQuery } = useSelector((state: RootState) => state.ui);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const handleSearch = () => {
    dispatch(setSearchQuery(localQuery));
    dispatch(setSearchResultsVisible(true));
    // TODO: Trigger search action
  };

  const handleInputChange = (text: string) => {
    setLocalQuery(text);
    dispatch(setSearchQuery(text));
    if (text.length === 0) {
      dispatch(setSearchResultsVisible(false));
    } else {
      dispatch(setSearchResultsVisible(true));
    }
  };

  const handleSubmit = () => {
    if (localQuery.trim()) {
      handleSearch();
    }
  };

  return (
    <View style={styles.container}>
      {showSlogan && <Text style={styles.slogan}>Welcome to The Team Human!</Text>}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles, entries, users..."
          value={localQuery}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.searchIcon}>
            <View style={styles.searchIconCircle} />
            <View style={styles.searchIconHandle} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 0,
    marginBottom: 0,
  },
  slogan: {
    position: 'absolute',
    top: -theme.spacing.xl * 1.5,  // Position above the search bar
    left: 0,
    right: 0,
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    backgroundImage: 'linear-gradient(135deg, #0d9488 0%, #0e7490 100%)',  // Sophisticated teal gradient
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    pointerEvents: 'none',
    height: theme.spacing.xl * 1.5,
    lineHeight: theme.spacing.xl * 1.5,
  },
  searchContainer: {
    marginTop: theme.spacing.sm,  // Small space above search bar
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    paddingLeft: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backdropFilter: 'blur(20px)',
    transition: `all ${theme.animations.normal} ${theme.animations.ease}`,
    '&:focus-within': {
      borderColor: theme.colors.primary,
      ...theme.shadows.glow,
    },
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
    fontWeight: theme.fonts.weights.medium as any,
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    outlineStyle: 'none' as any,
    outlineWidth: 0,
    outlineColor: 'transparent',
    '::placeholder': {
      color: theme.colors.textMuted,
    },
  },
  searchButton: {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
    padding: theme.spacing.md,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    transition: `all ${theme.animations.fast} ${theme.animations.ease}`,
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.05)',
      ...theme.shadows.md,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  searchIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  searchIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchIconHandle: {
    width: 6,
    height: 2,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    bottom: 2,
    right: 2,
    transform: [{ rotate: '45deg' }],
  },
});
