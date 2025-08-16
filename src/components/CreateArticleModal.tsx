import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { closeModal } from '../store/slices/uiSlice';
import { createArticle } from '../store/slices/articlesSlice';
import { theme } from '../styles/theme';

export const CreateArticleModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { modals } = useSelector((s: RootState) => s.ui);
  const { user } = useSelector((s: RootState) => s.auth);

  const [title, setTitle] = useState('');
  // description removed
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!modals.createArticle) return null;

  const onClose = () => dispatch(closeModal('createArticle'));

  const onSubmit = async () => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in to create a new title.');
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      Alert.alert('Invalid title', 'Please enter a title with at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createArticle({
          title: title.trim(),
          category: category.trim() || 'general',
          createdBy: user.id,
          slug: '', // will be generated server-side service
        } as any)
      ).unwrap();

      setTitle('');
      setCategory('general');
      onClose();
      Alert.alert('Success', 'New title created successfully');
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not create the title.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Create a New Title</Text>

        <TextInput
          style={styles.input}
          placeholder="Title (e.g., Quantum Computing)"
          value={title}
          onChangeText={setTitle}
        />

        {/* description input removed */}

        <TextInput
          style={styles.input}
          placeholder="Category (e.g., science)"
          value={category}
          onChangeText={setCategory}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={isSubmitting}>
          <Text style={styles.primaryBtnText}>{isSubmitting ? 'Creating...' : 'Create'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: theme.zIndex.modal,
    padding: theme.spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.overlay,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    fontFamily: theme.fonts.regular,
    marginBottom: theme.spacing.md,
  },
  textarea: {
    borderRadius: theme.borderRadius.md,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryBtnText: {
    color: theme.colors.surface,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  cancelText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});


