import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/types/database.types';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type Trip = Database['public']['Tables']['trips']['Row'];

interface TripCardProps {
  trip: Trip;
}

export default function TripCard({ trip }: TripCardProps) {
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

  return (
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
        title="Detayları Gör"
        onPress={() => console.log('Detayları Gör tıklandı')}
        style={styles.button}
      />
    </Card>
  );
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
