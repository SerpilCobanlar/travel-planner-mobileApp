import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import type { Database } from '@/types/database.types';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type TripDay = Database['public']['Tables']['trip_days']['Row'];
type TripItem = Database['public']['Tables']['trip_items']['Row'];

interface TripDayCardProps {
  day: TripDay;
  items?: TripItem[];
  onPress?: () => void;
}

export default function TripDayCard({ day, items = [], onPress }: TripDayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y}`;
  };

  const CardContent = (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title} type="subtitle">
          {t('trip.day')} {day.day_number}
        </ThemedText>
        <ThemedText style={styles.date} type="default" themeColor="textSecondary">
          {formatDate(day.day_date)}
        </ThemedText>
      </View>
      
      {day.title && (
        <ThemedText style={styles.dayTitle} type="default">
          {day.title}
        </ThemedText>
      )}

      {day.notes && (
        <ThemedText style={styles.notes} type="default" themeColor="textSecondary">
          {day.notes}
        </ThemedText>
      )}

      {items.length === 0 ? (
        <View style={[styles.placeholder, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <ThemedText type="default" themeColor="textSecondary" style={styles.placeholderText}>
            {t('trip.noPlansYet')}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.previewContainer, { borderColor: theme.border }]}>
          {items.slice(0, 3).map((item, index) => {
            let timeStr = '';
            if (item.start_at) {
              const d = new Date(item.start_at);
              timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            }
            return (
              <View key={item.id} style={styles.previewItem}>
                <ThemedText style={[styles.previewTime, { color: theme.primary }]} type="smallBold">
                  {timeStr || '•'}
                </ThemedText>
                <ThemedText style={styles.previewTitle} type="small" numberOfLines={1}>
                  {item.title}
                </ThemedText>
              </View>
            );
          })}
          <View style={styles.previewFooter}>
            <ThemedText style={styles.previewCount} type="smallBold" themeColor="textSecondary">
              {items.length === 1
                ? t('item.planCount1')
                : t('item.planCountPlural').replace('{count}', items.length.toString())}
            </ThemedText>

            {items.length > 3 && (
              <ThemedText style={styles.previewMore} type="small" themeColor="textSecondary">
                {t('item.planCountMore').replace('{count}', (items.length - 3).toString())}
              </ThemedText>
            )}
          </View>
        </View>
      )}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  date: {
    fontSize: 14,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notes: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  placeholder: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  placeholderText: {
    fontSize: 14,
  },
  previewContainer: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 6,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTime: {
    width: 40,
    fontSize: 12,
  },
  previewTitle: {
    flex: 1,
    fontSize: 13,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
  },
  previewCount: {
    fontSize: 12,
  },
  previewMore: {
    fontSize: 12,
    fontStyle: 'italic',
  }
});
