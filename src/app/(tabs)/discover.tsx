import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import type { Camera as CameraRef, ShapeSource } from '@rnmapbox/maps';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import TripCard from '@/components/TripCard';
import { getVisibleSheetHeight, ResizableSheet, snapSheetTo } from '@/components/ui/ResizableSheet';
import { DismissibleCard } from '@/components/ui/DismissibleCard';
import { SearchField } from '@/components/ui/SearchField';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import { useTranslation } from '@/localization';
import { filterDiscoverTrips, useDiscoverTrips, type DiscoverTrip } from '@/lib/queries/discover';
import { getUserLocation, hasLocationPermission } from '@/lib/userLocation';

initializeMapbox();

const DEFAULT_CENTER: [number, number] = [28.9784, 41.0082]; // Istanbul
/** Sheet height when collapsed: handle + title row stay visible. */
const COLLAPSED_SHEET_HEIGHT = 76;
const MAP_EDGE_PADDING = 40;
const FOCUS_ZOOM = 12;

type PinnedTrip = DiscoverTrip & { start: [number, number] };

function mapPadding(bottomInset: number) {
  return {
    paddingLeft: MAP_EDGE_PADDING,
    paddingRight: MAP_EDGE_PADDING,
    paddingTop: MAP_EDGE_PADDING,
    paddingBottom: bottomInset + MAP_EDGE_PADDING,
  };
}

/** Fit all pins in the part of the map above the half-open sheet. */
function getCameraSettings(pins: PinnedTrip[], bottomInset: number) {
  const padding = mapPadding(bottomInset);

  if (pins.length <= 1) {
    return {
      centerCoordinate: pins[0]?.start ?? DEFAULT_CENTER,
      zoomLevel: 10,
      padding,
      animationDuration: pins.length === 0 ? 0 : 500,
    };
  }

  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  for (const { start: [lng, lat] } of pins) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    bounds: { ne: [maxLng, maxLat] as [number, number], sw: [minLng, minLat] as [number, number], ...padding },
    animationDuration: 500,
  };
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const discoverQuery = useDiscoverTrips(user?.id);
  useRefreshOnFocus(discoverQuery.refetch);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerBottomY, setContainerBottomY] = useState(0);
  const [search, setSearch] = useState('');
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const sheetHeight = useSharedValue(0);
  const keyboardOverlap = useKeyboardOverlap(containerBottomY);
  const containerRef = useRef<View>(null);
  const listRef = useRef<FlatList<DiscoverTrip>>(null);
  const cameraRef = useRef<CameraRef>(null);
  const shapeSourceRef = useRef<ShapeSource>(null);

  // Show the blue "you are here" dot right away if permission was given before.
  useEffect(() => {
    hasLocationPermission()
      .then(setShowUserLocation)
      .catch(() => setShowUserLocation(false));
  }, []);

  const allTrips = useMemo(() => discoverQuery.data ?? [], [discoverQuery.data]);
  const trips = useMemo(() => filterDiscoverTrips(allTrips, deferredSearch), [allTrips, deferredSearch]);
  const pins = useMemo(
    () => trips.filter((entry): entry is PinnedTrip => entry.start !== null),
    [trips]
  );
  const pinShape = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: pins.map(({ trip, start }) => ({
        type: 'Feature' as const,
        id: trip.id,
        properties: { tripId: trip.id },
        geometry: { type: 'Point' as const, coordinates: start },
      })),
    }),
    [pins]
  );
  const cameraSettings = useMemo(() => getCameraSettings(pins, containerHeight / 2), [pins, containerHeight]);
  const selectedEntry = pins.find((entry) => entry.trip.id === selectedTripId) ?? null;
  const isSelected = ['==', ['get', 'tripId'], selectedTripId ?? ''];

  // The selected-trip card floats just above the sheet and follows it (dragging, keyboard).
  const cardPositionStyle = useAnimatedStyle(() => {
    const inset = keyboardOverlap.get();
    const visible = getVisibleSheetHeight(sheetHeight.get(), inset, containerHeight, COLLAPSED_SHEET_HEIGHT);
    return { bottom: inset + visible + 12 };
  });

  const openTrip = (tripId: string) => router.push(`/trips/${tripId}`);
  const closeCard = () => setSelectedTripId(null);

  const focusMap = (centerCoordinate: [number, number], zoomLevel: number, bottomInset: number) => {
    cameraRef.current?.setCamera({
      centerCoordinate,
      zoomLevel,
      padding: mapPadding(bottomInset),
      animationDuration: 600,
    });
  };

  /** From the list: half-open the sheet, fly to the trip's pin and show its card. */
  const showOnMap = (entry: PinnedTrip) => {
    const halfHeight = containerHeight / 2;
    snapSheetTo(sheetHeight, halfHeight);
    setSelectedTripId(entry.trip.id);
    focusMap(entry.start, FOCUS_ZOOM, halfHeight);
  };

  const goToMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const result = await getUserLocation();
      if (result.status === 'denied') {
        Alert.alert(t('discover.myLocation'), t('discover.locationDenied'));
        return;
      }
      if (result.status === 'services-off') {
        Alert.alert(t('discover.myLocation'), t('discover.locationServicesOff'));
        return;
      }
      setShowUserLocation(true);
      focusMap(result.coordinate, FOCUS_ZOOM, sheetHeight.get());
    } catch (error) {
      console.error('DISCOVER_LOCATION_ERROR', error);
      Alert.alert(t('discover.myLocation'), t('discover.locationError'));
    } finally {
      setLocating(false);
    }
  };

  const onPinPress = async (feature: GeoJSON.Feature | undefined) => {
    if (!feature || feature.geometry.type !== 'Point') return;
    const coordinate = feature.geometry.coordinates as [number, number];

    // A cluster: zoom in until it splits into separate pins.
    if (feature.properties?.cluster) {
      try {
        const zoom = await shapeSourceRef.current?.getClusterExpansionZoom(feature);
        if (zoom !== undefined) focusMap(coordinate, zoom, sheetHeight.get());
      } catch (error) {
        console.error('DISCOVER_CLUSTER_ZOOM_ERROR', error);
      }
      return;
    }

    const tripId = feature.properties?.tripId;
    if (typeof tripId === 'string') setSelectedTripId(tripId);
  };

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(Math.round(event.nativeEvent.layout.height));
    // Bottom edge on screen: the keyboard overlap is measured against it.
    containerRef.current?.measureInWindow((_x, y, _width, height) => setContainerBottomY(y + height));
  };

  const tripCountLabel = `${trips.length} ${t(trips.length === 1 ? 'discover.tripCountOne' : 'discover.tripCountOther')}`;

  const sheetHeader = (
    <View style={styles.sheetHeaderRow}>
      <ThemedText style={styles.listTitle} type="subtitle">
        {t('common.publicTrips')}
      </ThemedText>
      {allTrips.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {tripCountLabel}
        </ThemedText>
      )}
    </View>
  );

  const renderListBody = () => {
    if (trips.length > 0) {
      return (
        <FlatList
          ref={listRef}
          data={trips}
          keyExtractor={(entry) => entry.trip.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item.trip}
              size="compact"
              showVisibilityBadge={false}
              ownerUsername={item.ownerUsername}
              onPress={() => openTrip(item.trip.id)}
              onShowOnMap={item.start ? () => showOnMap(item as PinnedTrip) : undefined}
            />
          )}
          ListHeaderComponent={
            pins.length < trips.length ? (
              <ThemedText style={styles.hint} type="small" themeColor="textSecondary">
                {t('discover.mapHint')}
              </ThemedText>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={discoverQuery.isRefetching}
          onRefresh={() => discoverQuery.refetch()}
          // Always show that the list scrolls: persistent bar on Android, a flash on iOS.
          showsVerticalScrollIndicator
          persistentScrollbar
          onContentSizeChange={() => listRef.current?.flashScrollIndicators()}
        />
      );
    }

    let content: React.ReactNode;
    if (discoverQuery.isPending) {
      content = <ActivityIndicator size="large" color={theme.primary} />;
    } else if (discoverQuery.isError) {
      content = (
        <ThemedText style={styles.stateText} themeColor="error">
          {t('trip.fetchError')}
        </ThemedText>
      );
    } else {
      content = (
        <ThemedText style={styles.stateText} themeColor="textSecondary">
          {allTrips.length > 0 ? t('discover.noSearchResults') : t('common.emptyTrips')}
        </ThemedText>
      );
    }
    return <View style={styles.center}>{content}</View>;
  };

  return (
    <Screen safeArea padded={false}>
      <View ref={containerRef} style={styles.body} onLayout={onContainerLayout}>
        <Mapbox.MapView style={StyleSheet.absoluteFill} onPress={closeCard}>
          <Mapbox.Camera ref={cameraRef} {...cameraSettings} />
          {showUserLocation && <Mapbox.UserLocation visible />}

          <Mapbox.ShapeSource
            ref={shapeSourceRef}
            id="discoverTrips"
            shape={pinShape}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={14}
            hitbox={{ width: 32, height: 32 }}
            onPress={(event) => onPinPress(event.features[0])}
          >
            <Mapbox.CircleLayer
              id="discoverClusters"
              filter={['has', 'point_count']}
              style={{
                circleColor: theme.primary,
                circleRadius: ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
                circleStrokeColor: theme.background,
                circleStrokeWidth: 3,
              }}
            />
            <Mapbox.SymbolLayer
              id="discoverClusterCount"
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count_abbreviated'],
                textSize: 13,
                textColor: '#ffffff',
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
            <Mapbox.CircleLayer
              id="discoverTripPins"
              filter={['!', ['has', 'point_count']]}
              style={{
                circleRadius: ['case', isSelected, 11, 8],
                circleColor: ['case', isSelected, theme.primary, theme.backgroundElement],
                circleStrokeColor: ['case', isSelected, theme.background, theme.primary],
                circleStrokeWidth: 3,
              }}
            />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>

        <Pressable
          onPress={goToMyLocation}
          accessibilityRole="button"
          accessibilityLabel={t('discover.myLocation')}
          style={[styles.locationButton, { backgroundColor: theme.background, borderColor: theme.border }]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <IconSymbol name="location.fill" size={22} color={theme.primary} />
          )}
        </Pressable>

        {selectedEntry && (
          <DismissibleCard
            itemKey={selectedEntry.trip.id}
            onDismiss={closeCard}
            closeLabel={t('discover.closeCard')}
            style={[styles.selectedCard, cardPositionStyle]}
          >
            <TripCard
              trip={selectedEntry.trip}
              size="mini"
              showVisibilityBadge={false}
              ownerUsername={selectedEntry.ownerUsername}
              onPress={() => openTrip(selectedEntry.trip.id)}
            />
          </DismissibleCard>
        )}

        {containerHeight > 0 && (
          <ResizableSheet
            containerHeight={containerHeight}
            collapsedHeight={COLLAPSED_SHEET_HEIGHT}
            height={sheetHeight}
            bottomInset={keyboardOverlap}
            header={sheetHeader}
            accessibilityLabel={t('discover.resizeHandle')}
          >
            {allTrips.length > 0 && (
              <View style={styles.searchContainer}>
                <SearchField
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('discover.searchPlaceholder')}
                  clearLabel={t('discover.clearSearch')}
                />
              </View>
            )}
            {renderListBody()}
          </ResizableSheet>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    overflow: 'hidden',
  },
  locationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectedCard: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hint: {
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
