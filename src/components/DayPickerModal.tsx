import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/localization';
import { formatDayDate } from '@/lib/date';
import type { TripDay } from '@/lib/queries/trips';

interface DayPickerModalProps {
  visible: boolean;
  title: string;
  days: TripDay[];
  /** Shown but not selectable (e.g. the plan's current day). */
  disabledDayId?: string;
  onSelect: (day: TripDay) => void;
  onClose: () => void;
}

/** Bottom modal listing a trip's days ("Day 2 · 12.06.2026") to pick one. */
export function DayPickerModal({ visible, title, days, disabledDayId, onSelect, onClose }: DayPickerModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('item.cancel')} />
      <View style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <ThemedText style={styles.title} type="subtitle">
          {title}
        </ThemedText>
        <FlatList
          data={days}
          keyExtractor={(day) => day.id}
          renderItem={({ item: day }) => {
            const disabled = day.id === disabledDayId;
            return (
              <Pressable
                onPress={() => onSelect(day)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: theme.border },
                  pressed && { backgroundColor: theme.backgroundElement },
                  disabled && styles.disabledRow,
                ]}
              >
                <ThemedText type="smallBold">
                  {t('trip.day')} {day.day_number}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDayDate(day.day_date)}
                  {day.title ? ` · ${day.title}` : ''}
                </ThemedText>
              </Pressable>
            );
          }}
        />
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <ThemedText style={{ color: theme.primary }} type="smallBold">
            {t('item.cancel')}
          </ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  disabledRow: {
    opacity: 0.4,
  },
  cancel: {
    alignItems: 'center',
    paddingTop: 16,
  },
});
