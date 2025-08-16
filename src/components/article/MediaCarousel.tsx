import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Entry } from '../../types';
import { theme } from '../../styles/theme';

interface Props {
  entries: Entry[];
  title?: string;
}

/**
 * Displays a horizontal strip of media thumbnails (images and videos)
 * from the provided entries. Clicking opens a simple modal preview.
 */
export const MediaCarousel: React.FC<Props> = ({ entries, title = 'Popular media' }) => {
  const mediaItems = useMemo(() => {
    return entries
      .filter((e) => (e.type === 'image' || e.type === 'video') && e.media?.url)
      .map((e) => ({
        id: e.id,
        type: e.type,
        // Use image URL for images, thumbnail if available for videos
        thumbnail: e.type === 'image' ? (e.media?.thumbnail || e.media?.url || '') : (e.media?.thumbnail || ''),
        url: e.media?.url || '',
        caption: e.content,
      }));
  }, [entries]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (mediaItems.length === 0) return null;

  const activeItem = activeIndex !== null ? mediaItems[activeIndex] : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {mediaItems.map((item, index) => (
          <TouchableOpacity key={item.id} style={styles.thumbContainer} onPress={() => setActiveIndex(index)}>
            {item.type === 'image' ? (
              <Image
                // @ts-ignore RN Web
                source={{ uri: item.thumbnail || item.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoThumbWrapper}>
                {item.thumbnail ? (
                  <Image
                    // @ts-ignore RN Web
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.thumbnail, styles.videoFallback]} />
                )}
                <View style={styles.playBadge}>
                  <Text style={styles.playBadgeText}>▶</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preview modal */}
      <Modal visible={activeIndex !== null} transparent animationType="fade" onRequestClose={() => setActiveIndex(null)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveIndex(null)} />
          <View style={styles.modalContent}>
            {activeItem?.type === 'image' ? (
              <Image
                // @ts-ignore RN Web
                source={{ uri: activeItem.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : activeItem ? (
              // @ts-ignore - intrinsic web element in RN Web
              <iframe
                src={activeItem.url}
                style={{ width: '100%', height: 420, border: 'none', borderRadius: theme.borderRadius.md }}
                title="Media preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : null}
            {activeItem?.caption ? <Text style={styles.caption}>{activeItem.caption}</Text> : null}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveIndex(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: { fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  strip: { gap: theme.spacing.sm },
  thumbContainer: {
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    width: 220,
    height: 120,
    backgroundColor: theme.colors.overlay,
  },
  thumbnail: { width: '100%', height: '100%' },
  videoThumbWrapper: { position: 'relative', width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    right: theme.spacing.sm,
    bottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface + 'bb',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  playBadgeText: { color: theme.colors.primary, fontWeight: theme.fonts.weights.bold },
  videoFallback: { backgroundColor: theme.colors.overlay },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 900,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  modalImage: { width: '100%', height: 420, backgroundColor: theme.colors.overlay, borderRadius: theme.borderRadius.md },
  caption: { marginTop: theme.spacing.sm, color: theme.colors.text },
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  closeBtnText: { color: theme.colors.surface, fontWeight: theme.fonts.weights.semibold },
});



