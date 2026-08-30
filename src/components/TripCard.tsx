import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/types/database.types';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type Trip = Database['public']['Tables']['trips']['Row'];

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y}`;
  };

  const isPublicText = trip.is_public ? t('trip.isPublic') : t('trip.isPrivate');
  const badgeColor = trip.is_public ? theme.primary : theme.textSecondary;

  const CardContent = (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title} type="subtitle" numberOfLines={1}>
          {trip.title || 'İsimsiz Gezi'}
        </ThemedText>
        <View style={[styles.badge, { borderColor: badgeColor }]}>
          <ThemedText style={[styles.badgeText, { color: badgeColor }]}>{isPublicText}</ThemedText>
        </View>
      </View>

      {trip.description ? (
        <ThemedText style={styles.description} type="default" themeColor="textSecondary" numberOfLines={2}>
          {trip.description}
        </ThemedText>
      ) : null}

      <View style={styles.dateRow}>
        <ThemedText type="default" themeColor="textSecondary" style={styles.dateText}>
          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
        </ThemedText>
      </View>

      <Button
        title={t('trip.details')}
        onPress={onPress}
        style={styles.button}
      />
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 12,
  },
  dateRow: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 4,
  },
});
