import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';
import TripItemCard from '@/components/TripItemCard';

type TripItem = Database['public']['Tables']['trip_items']['Row'];

initializeMapbox();

export default function DayMapScreen() {
  const { id, dayId, focusItemId } = useLocalSearchParams<{ id: string; dayId: string; focusItemId?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(focusItemId || null);

  useEffect(() => {
    (async () => {
      try {
        if (!id || !dayId) return;
        setLoading(true);

        // Verify day belongs to trip
        const { data: dayData, error: dayError } = await supabase
          .from('trip_days')
          .select('id')
          .eq('id', dayId)
          .eq('trip_id', id)
          .single();

        if (dayError || !dayData) {
          throw new Error('Day mismatch');
        }

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('trip_items')
          .select('*')
          .eq('trip_id', id)
          .eq('trip_day_id', dayId)
          .order('start_at', { ascending: true, nullsFirst: false })
          .order('sort_order', { ascending: true });

        if (itemsError) throw itemsError;

        // Filter items with location
        const locItems = (itemsData || []).filter(
          (i) => i.latitude !== null && i.longitude !== null
        );

        setItems(locItems);
      } catch (err: any) {
        console.error('DAY_MAP_FETCH_ERROR', err);
        setError(t('trip.fetchError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, dayId, t]);

  const cameraSettings = useMemo(() => {
    if (items.length === 0) return null;

    if (focusItemId) {
      const focusItem = items.find((i) => i.id === focusItemId);
      if (focusItem && focusItem.latitude !== null && focusItem.longitude !== null) {
        return {
          centerCoordinate: [focusItem.longitude, focusItem.latitude] as [number, number],
          zoomLevel: 14,
          animationDuration: 500,
        };
      }
    }

    if (items.length === 1) {
      const item = items[0];
      return {
        centerCoordinate: [item.longitude!, item.latitude!] as [number, number],
        zoomLevel: 14,
        animationDuration: 500,
      };
    }

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    items.forEach((item) => {
      if (item.latitude !== null && item.longitude !== null) {
        if (item.latitude < minLat) minLat = item.latitude;
        if (item.latitude > maxLat) maxLat = item.latitude;
        if (item.longitude < minLng) minLng = item.longitude;
        if (item.longitude > maxLng) maxLng = item.longitude;
      }
    });

    return {
      bounds: {
        ne: [maxLng, maxLat] as [number, number],
        sw: [minLng, minLat] as [number, number],
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 40,
        paddingBottom: 200, // Make room for bottom card
      },
      animationDuration: 500,
    };
  }, [items, focusItemId]);

  if (loading) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.dayMap'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.dayMap'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ThemedText style={styles.errorText} themeColor="error">
            {error}
          </ThemedText>
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.dayMap'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ThemedText style={styles.emptyText} themeColor="textSecondary">
            {t('trip.noLocations')}
          </ThemedText>
        </View>
      </Screen>
    );
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <Screen safeArea padded={false}>
      <Stack.Screen options={{ title: t('trip.dayMap'), headerBackTitle: 'Geri' }} />
      <View style={styles.container}>
        <Mapbox.MapView style={styles.map}>
          {cameraSettings && (
            <Mapbox.Camera {...cameraSettings} />
          )}

          {items.map((item, index) => {
            const isSelected = item.id === selectedItemId;
            return (
              <Mapbox.PointAnnotation
                key={item.id}
                id={item.id}
                coordinate={[item.longitude!, item.latitude!]}
                onSelected={() => setSelectedItemId(item.id)}
              >
                <View
                  style={[
                    styles.markerContainer,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                      borderColor: isSelected ? theme.background : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.markerText,
                      { color: isSelected ? '#ffffff' : theme.text },
                    ]}
                  >
                    {index + 1}
                  </ThemedText>
                </View>
              </Mapbox.PointAnnotation>
            );
          })}
        </Mapbox.MapView>

        {selectedItem && (
          <View style={styles.bottomCardContainer} pointerEvents="box-none">
            <TripItemCard
              item={selectedItem}
              canEdit={false} // Map view is read-only
            />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32, // Extra padding for safe area / aesthetic
  },
});
