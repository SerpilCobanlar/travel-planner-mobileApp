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
  onShowMap?: (item: TripItem) => void;
}

export default function TripItemCard({ item, canEdit, onEdit, onDelete, onShowMap }: TripItemCardProps) {
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
        </View>
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

      {/* Footer for Metadata and Actions */}
      {((item.latitude && item.longitude) || canEdit) && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {item.latitude && item.longitude && (
              <View style={[styles.badge, { backgroundColor: theme.primary + '10' }]}>
                <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
                  📍 {t('item.locationAdded')}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {item.latitude !== null && item.longitude !== null && onShowMap && (
              <TouchableOpacity onPress={() => onShowMap(item)} style={styles.actionButton}>
                <ThemedText style={[styles.actionText, { color: theme.primary }]}>{t('trip.showOnMap')}</ThemedText>
              </TouchableOpacity>
            )}

            {canEdit && (
              <>
                <TouchableOpacity onPress={() => onEdit && onEdit(item)} style={styles.actionButton}>
                  <ThemedText style={styles.actionText}>{t('item.edit')}</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                  <ThemedText style={[styles.actionText, { color: theme.error }]}>{t('item.delete')}</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
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
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5', // we can rely on theme in a more complex setup, but hairlineWidth is subtle
  },
  footerLeft: {
    marginRight: 8,
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
