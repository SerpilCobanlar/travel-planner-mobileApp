import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import type { Database } from '@/types/database.types';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type TripDay = Database['public']['Tables']['trip_days']['Row'];

interface TripDayCardProps {
  day: TripDay;
  onPress?: () => void;
}

export default function TripDayCard({ day, onPress }: TripDayCardProps) {
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

      {/* Placeholder for future items */}
      <View style={[styles.placeholder, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.placeholderText}>
          {t('trip.noPlansYet')}
        </ThemedText>
      </View>
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
  }
});
