import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import TripItemCard from '@/components/TripItemCard';
import { useTripDays, useTripItems } from '@/lib/queries/trips';
import { DirectionProfile, fetchDirections } from '@/lib/mapboxDirections';

initializeMapbox();

const MAX_ROUTE_POINTS = 25; // Mapbox Directions API limit

export default function DayMapScreen() {
  const { id, dayId, focusItemId } = useLocalSearchParams<{ id: string; dayId: string; focusItemId?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(focusItemId || null);
  const [profile, setProfile] = useState<DirectionProfile>('walking');

  const daysQuery = useTripDays(id);
  const itemsQuery = useTripItems(id);
  useRefreshOnFocus(itemsQuery.refetch);

  const dayBelongsToTrip = daysQuery.data?.some((d) => d.id === dayId) ?? false;
  const loading = daysQuery.isPending || itemsQuery.isPending;
  const error =
    daysQuery.error || itemsQuery.error || (!loading && !dayBelongsToTrip) ? t('trip.fetchError') : null;

  // Plans of this day that have a location, in plan order
  const items = useMemo(
    () =>
      (itemsQuery.data ?? []).filter(
        (i) => i.trip_day_id === dayId && i.latitude !== null && i.longitude !== null
      ),
    [itemsQuery.data, dayId]
  );

  const coordinates = useMemo(
    () => items.map((i) => [i.longitude!, i.latitude!] as [number, number]),
    [items]
  );

  // Cached per profile + coordinates: switching walking/driving back and forth
  // doesn't call the Directions API again.
  const canRoute = coordinates.length >= 2 && coordinates.length <= MAX_ROUTE_POINTS;
  const routeQuery = useQuery({
    queryKey: ['directions', profile, coordinates],
    queryFn: () => fetchDirections(profile, coordinates),
    enabled: canRoute,
    staleTime: Infinity,
  });

  const route = canRoute ? (routeQuery.data ?? null) : null;
  const routeLoading = canRoute && routeQuery.isFetching && !routeQuery.data;
  let routeError: string | null = null;
  if (items.length === 1) routeError = t('trip.routeMinTwoLocations');
  else if (items.length > MAX_ROUTE_POINTS) routeError = t('trip.routeMax25Locations');
  else if (canRoute && routeQuery.isError) routeError = t('trip.routeCreateError');

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const min = Math.round(seconds / 60);
    const mStr = t('common.minutesShort');
    const hStr = t('common.hoursShort');

    if (min < 60) return `${min} ${mStr}`;
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${hr} ${hStr} ${m} ${mStr}` : `${hr} ${hStr}`;
  };

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
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('trip.dayMap') }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('trip.dayMap') }} />
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
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('trip.dayMap') }} />
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
    <Screen safeArea={false} padded={false}>
      <Stack.Screen options={{ title: t('trip.dayMap') }} />
      <View style={styles.container}>
        <Mapbox.MapView style={styles.map}>
          {cameraSettings && (
            <Mapbox.Camera {...cameraSettings} />
          )}

          {route && route.geometry && (
            <Mapbox.ShapeSource id="routeSource" shape={route.geometry}>
              <Mapbox.LineLayer
                id="routeLine"
                style={{
                  lineColor: theme.primary,
                  lineWidth: 4,
                  lineOpacity: 0.7,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
              {/* Arrows along the line show which way the route goes (#49).
                  keepUpright must be off, or arrows flip on westbound parts. */}
              <Mapbox.SymbolLayer
                id="routeArrows"
                aboveLayerID="routeLine"
                style={{
                  symbolPlacement: 'line',
                  symbolSpacing: 80,
                  textField: '>',
                  textSize: 16,
                  textColor: theme.primary,
                  textHaloColor: '#ffffff',
                  textHaloWidth: 1.5,
                  textKeepUpright: false,
                  textRotationAlignment: 'map',
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                }}
              />
            </Mapbox.ShapeSource>
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

        <View style={styles.topOverlay} pointerEvents="box-none">
          {items.length > 1 && items.length <= 25 && (
            <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.segmentBtn, profile === 'walking' && { backgroundColor: theme.background }]}
                onPress={() => setProfile('walking')}
              >
                <ThemedText style={[styles.segmentText, profile === 'walking' && { color: theme.primary }]}>
                  {t('trip.walking')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, profile === 'driving' && { backgroundColor: theme.background }]}
                onPress={() => setProfile('driving')}
              >
                <ThemedText style={[styles.segmentText, profile === 'driving' && { color: theme.primary }]}>
                  {t('trip.driving')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {routeLoading && (
            <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          )}

          {!routeLoading && route && (
            <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ThemedText type="smallBold">
                {profile === 'walking' ? t('trip.walking') : t('trip.driving')}
              </ThemedText>
              <ThemedText type="default">
                {formatDistance(route.distance)} • {formatDuration(route.duration)}
              </ThemedText>
            </View>
          )}

          {!routeLoading && routeError && (
            <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="error">
                {routeError}
              </ThemedText>
            </View>
          )}
        </View>

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
    paddingBottom: 32,
  },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }
});
