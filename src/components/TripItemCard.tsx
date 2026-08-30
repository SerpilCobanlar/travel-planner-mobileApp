import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import type { Database } from '@/types/database.types';
import { useTranslation, TranslationKey } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type TripItem = Database['public']['Tables']['trip_items']['Row'];

interface TripItemCardProps {
  item: TripItem;
  canEdit?: boolean;
  onEdit?: (item: TripItem) => void;
  onDelete?: (item: TripItem) => void;
}

export default function TripItemCard({ item, canEdit, onEdit, onDelete }: TripItemCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Try to translate type, fallback to raw string
  const typeTranslationKey = `item.types.${item.type}` as TranslationKey;
  const translatedType = t(typeTranslationKey);

  let timeString = '';
  if (item.start_at) {
    const sd = new Date(item.start_at);
    const shh = sd.getHours().toString().padStart(2, '0');
    const smm = sd.getMinutes().toString().padStart(2, '0');
    timeString = `${shh}:${smm}`;

    if (item.end_at) {
      const ed = new Date(item.end_at);
      const ehh = ed.getHours().toString().padStart(2, '0');
      const emm = ed.getMinutes().toString().padStart(2, '0');
      timeString += ` - ${ehh}:${emm}`;
    }
  }

  const handleDelete = () => {
    Alert.alert(
      t('item.deletePlan'),
      t('item.deleteConfirm'),
      [
        { text: t('item.cancel'), style: 'cancel' },
        {
          text: t('item.delete'),
          style: 'destructive',
          onPress: () => {
            if (onDelete) onDelete(item);
          }
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {timeString ? (
            <View style={[styles.timeBadge, { backgroundColor: theme.text + '10' }]}>
              <ThemedText style={[styles.timeText, { color: theme.text }]}>
                {timeString}
              </ThemedText>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              {translatedType}
            </ThemedText>
          </View>
          {item.latitude && item.longitude && (
            <View style={[styles.badge, { backgroundColor: theme.primary + '10' }]}>
              <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                📍 {t('item.locationAdded')}
              </ThemedText>
            </View>
          )}
        </View>

        {canEdit && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit && onEdit(item)} style={styles.actionButton}>
              <ThemedText style={styles.actionText}>{t('item.edit')}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <ThemedText style={[styles.actionText, { color: theme.error }]}>{t('item.delete')}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <ThemedText style={styles.title} type="default">
          {item.title}
        </ThemedText>

        {item.cost !== null && item.currency !== null && (
          <ThemedText style={styles.cost} type="default">
            {item.cost} {item.currency}
          </ThemedText>
        )}
      </View>

      {item.notes ? (
        <ThemedText style={styles.notes} type="default" themeColor="textSecondary">
          {item.notes}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  cost: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
  }
});
