import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import type { Database } from '@/types/database.types';
import { useTranslation, TranslationKey } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

type TripItem = Database['public']['Tables']['trip_items']['Row'];

interface TripItemCardProps {
  item: TripItem;
}

export default function TripItemCard({ item }: TripItemCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Try to translate type, fallback to raw string
  const typeTranslationKey = `item.types.${item.type}` as TranslationKey;
  const translatedType = t(typeTranslationKey);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
          <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
            {translatedType}
          </ThemedText>
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
    marginBottom: 8,
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
