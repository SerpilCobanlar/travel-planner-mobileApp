import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/types/database.types';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { formatDayRange } from '@/lib/date';

type Trip = Database['public']['Tables']['trips']['Row'];

/**
 * - default: full card (home list)
 * - compact: tighter card with smaller buttons (Discover list)
 * - mini: title + owner/date only, no buttons; the whole card is the tap target (map overlay)
 */
export type TripCardSize = 'default' | 'compact' | 'mini';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
  size?: TripCardSize;
  /** Shown as "@username" under the title (e.g. on Discover). */
  ownerUsername?: string | null;
  /** Adds a "Show on map" button next to Details. */
  onShowOnMap?: () => void;
  /** Public/private badge; redundant where every trip is public (Discover). */
  showVisibilityBadge?: boolean;
}

export default function TripCard({
  trip,
  onPress,
  size = 'default',
  ownerUsername,
  onShowOnMap,
  showVisibilityBadge = true,
}: TripCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const isCompact = size === 'compact';
  const isMini = size === 'mini';
  const isPublicText = trip.is_public ? t('trip.isPublic') : t('trip.isPrivate');
  const badgeColor = trip.is_public ? theme.primary : theme.textSecondary;
  const dateRange = formatDayRange(trip.start_date, trip.end_date);
  const buttonStyle = [styles.button, isCompact && styles.compactButton];
  const buttonTextStyle = isCompact ? styles.compactButtonText : undefined;

  const CardContent = (
    <Card style={[styles.card, isCompact && styles.compactCard, isMini && styles.miniCard]}>
      <View style={[styles.header, (isCompact || isMini) && styles.tightHeader]}>
        <ThemedText
          style={[styles.title, isCompact && styles.compactTitle, isMini && styles.miniTitle]}
          type="subtitle"
          numberOfLines={1}
        >
          {trip.title || t('common.untitledTrip')}
        </ThemedText>
        {showVisibilityBadge && (
          <View style={[styles.badge, { borderColor: badgeColor }]}>
            <ThemedText style={[styles.badgeText, { color: badgeColor }]}>{isPublicText}</ThemedText>
          </View>
        )}
      </View>

      {isMini ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {ownerUsername ? `@${ownerUsername} · ${dateRange}` : dateRange}
        </ThemedText>
      ) : (
        <>
          {ownerUsername ? (
            <ThemedText style={styles.owner} type="small" themeColor="textSecondary" numberOfLines={1}>
              @{ownerUsername}
            </ThemedText>
          ) : null}

          {trip.description ? (
            <ThemedText
              style={[styles.description, isCompact && styles.compactDescription]}
              type="default"
              themeColor="textSecondary"
              numberOfLines={isCompact ? 1 : 2}
            >
              {trip.description}
            </ThemedText>
          ) : null}

          <View style={[styles.dateRow, isCompact && styles.compactDateRow]}>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={[styles.dateText, isCompact && styles.compactDateText]}
            >
              {dateRange}
            </ThemedText>
          </View>

          {onShowOnMap ? (
            <View style={styles.buttonRow}>
              <Button
                title={t('discover.showOnMap')}
                onPress={onShowOnMap}
                variant="outline"
                icon="map"
                style={[buttonStyle, styles.rowButton]}
                textStyle={buttonTextStyle}
              />
              <Button
                title={t('trip.details')}
                onPress={onPress}
                style={[buttonStyle, styles.rowButton]}
                textStyle={buttonTextStyle}
              />
            </View>
          ) : (
            <Button title={t('trip.details')} onPress={onPress} style={buttonStyle} textStyle={buttonTextStyle} />
          )}
        </>
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
    marginBottom: 16,
  },
  compactCard: {
    padding: 12,
    marginBottom: 10,
  },
  miniCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tightHeader: {
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 17,
  },
  miniTitle: {
    fontSize: 16,
    marginRight: 28, // room for the card's close (×) button
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
  owner: {
    marginTop: -4,
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
  },
  compactDescription: {
    marginBottom: 6,
  },
  dateRow: {
    marginBottom: 16,
  },
  compactDateRow: {
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactDateText: {
    fontSize: 13,
  },
  button: {
    marginTop: 4,
  },
  compactButton: {
    height: 38,
    marginTop: 0,
  },
  compactButtonText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rowButton: {
    flex: 1,
  },
});
