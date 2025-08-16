import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { createEntry } from '../../store/slices/entriesSlice';
import { uploadEntryImage } from '../../services/uploads';
import { getYouTubeVideoInfo, isValidYouTubeUrl } from '../../utils/youtube';

interface Props {
  articleId: string;
}

export const EntryComposer: React.FC<Props> = ({ articleId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<'none' | 'image' | 'video'>('none');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = async () => {
    if (!user) return;
    if (!text.trim() && !imageFile && !youtubeUrl.trim()) return;
    setLoading(true);
    try {
      if (attachmentType === 'image' && imageFile) {
        // Image entry
        const { url } = await uploadEntryImage(user.id, imageFile);
        await dispatch(
          createEntry({
            articleId,
            userId: user.id,
            content: text.trim(), // optional caption
            type: 'image',
            media: { type: 'image', url },
          } as any)
        ).unwrap();
      } else if (attachmentType === 'video' && youtubeUrl.trim()) {
        // Video entry
        const videoInfo = getYouTubeVideoInfo(youtubeUrl.trim());
        if (!videoInfo) {
          throw new Error('Invalid YouTube URL. Please check the link and try again.');
        }
        await dispatch(
          createEntry({
            articleId,
            userId: user.id,
            content: text.trim(), // optional caption
            type: 'video',
            media: { 
              type: 'video', 
              url: videoInfo.embedUrl,
              thumbnail: videoInfo.thumbnailUrl 
            },
          } as any)
        ).unwrap();
      } else {
        // Text-only entry
        await dispatch(
          createEntry({
            articleId,
            userId: user.id,
            content: text.trim(),
            type: 'text',
          } as any)
        ).unwrap();
      }
      
      // Reset form
      setText('');
      setImageFile(null);
      setYoutubeUrl('');
      setAttachmentType('none');
      if (fileInputRef.current) fileInputRef.current.value = '' as any;
    } catch (error: any) {
      console.error('Error posting entry:', error);
      alert(error.message || 'Failed to post entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setAttachmentType('image');
    setYoutubeUrl('');
    fileInputRef.current?.click();
  };

  const handleAddVideo = () => {
    if (attachmentType === 'video') {
      // Toggle off video mode
      setAttachmentType('none');
      setYoutubeUrl('');
    } else {
      // Switch to video mode
      setAttachmentType('video');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '' as any;
    }
  };

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    if (url.trim() && !isValidYouTubeUrl(url)) {
      // Could add visual feedback for invalid URLs here
    }
  };

  if (!user) {
    // Hide composer when signed out; top-right LoginWidget handles auth
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.composerHeader}>
        <Text style={styles.composerTitle}>Share Your Thoughts</Text>
      </View>
      
      {/* Hidden file input for image selection (web only) */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      {/* @ts-ignore - intrinsic web element in RN Web */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e: any) => {
          const file = e.target?.files?.[0] as File | undefined;
          if (file) setImageFile(file);
        }}
      />
      
      {/* YouTube URL input (only shown when in video mode) */}
      {attachmentType === 'video' && (
        <TextInput
          style={[styles.input, styles.urlInput]}
          placeholder="Paste YouTube video URL (e.g., https://youtu.be/dQw4w9WgXcQ)"
          value={youtubeUrl}
          onChangeText={handleYoutubeUrlChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      
      <TextInput
        style={[styles.input, text && styles.inputActive]}
        placeholder={
          attachmentType === 'image' && imageFile ? 'Add a caption for your image...' :
          attachmentType === 'video' ? 'Add a caption for your video...' :
          'Share your thoughts about this article...'
        }
        value={text}
        onChangeText={setText}
        multiline
      />
      
      <View style={styles.actionsRow}>
        <View style={styles.attachmentButtons}>
          <TouchableOpacity
            style={[styles.secondaryBtn, attachmentType === 'image' && styles.secondaryBtnActive]}
            onPress={handleAddImage}
            disabled={loading}
          >
            <Text style={[styles.secondaryBtnText, attachmentType === 'image' && styles.secondaryBtnTextActive]}>
              {imageFile ? '✓ Image' : '📷 Image'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.secondaryBtn, attachmentType === 'video' && styles.secondaryBtnActive]}
            onPress={handleAddVideo}
            disabled={loading}
          >
            <Text style={[styles.secondaryBtnText, attachmentType === 'video' && styles.secondaryBtnTextActive]}>
              {attachmentType === 'video' ? '✓ Video' : '🎥 Video'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.btn, (!text.trim() && !imageFile && !youtubeUrl.trim()) && styles.btnDisabled]} 
          onPress={onSubmit} 
          disabled={loading || (!text.trim() && !imageFile && !youtubeUrl.trim())}
        >
          <Text style={styles.btnText}>{loading ? 'Posting...' : 'Post Entry'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  
  // Login prompt styles
  loginPrompt: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loginIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  loginHint: { 
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.fonts.weights.semibold as any,
  },
  
  // Composer header
  composerHeader: {
    backgroundColor: theme.colors.primary + '08',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  composerTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold as any,
    color: theme.colors.text,
  },
  
  // Input styles
  input: {
    minHeight: 80,
    borderRadius: 0,
    backgroundColor: 'transparent',
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    transition: 'all 0.2s ease',
  },
  inputActive: {
    backgroundColor: theme.colors.overlay + '50',
  },
  urlInput: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary + '30',
    backgroundColor: theme.colors.primary + '05',
  },
  
  // Actions row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.overlay + '30',
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  // Buttons
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    transition: 'all 0.2s ease',
  },
  btnDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.6,
  },
  btnText: { 
    color: theme.colors.surface, 
    fontWeight: theme.fonts.weights.semibold as any,
    fontSize: theme.fonts.sizes.md,
  },
  secondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    transition: 'all 0.2s ease',
  },
  secondaryBtnActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  secondaryBtnText: { 
    color: theme.colors.textSecondary, 
    fontWeight: theme.fonts.weights.medium as any,
    fontSize: theme.fonts.sizes.sm,
  },
  secondaryBtnTextActive: { 
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold as any,
  },
});


