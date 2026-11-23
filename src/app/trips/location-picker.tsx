import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';
import { setPickedLocation } from '@/lib/locationStore';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

initializeMapbox();

// Istanbul, used when location permission is denied or unavailable.
const DEFAULT_CENTER: [number, number] = [28.9784, 41.0082];

export default function LocationPickerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  // Read initial coordinates if provided
  // Note: 0 is a valid latitude/longitude, so check for null, not truthiness.
  const parsedLat = params.lat ? parseFloat(params.lat as string) : NaN;
  const parsedLng = params.lng ? parseFloat(params.lng as string) : NaN;
  const initialLat = Number.isFinite(parsedLat) ? parsedLat : null;
  const initialLng = Number.isFinite(parsedLng) ? parsedLng : null;
  const hasInitialCoord = initialLat !== null && initialLng !== null;

  const mapRef = useRef<Mapbox.MapView>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  // Initial camera position only; the selected point is read from the map on "Select".
  const [centerCoord, setCenterCoord] = useState<[number, number] | null>(
    hasInitialCoord ? [initialLng, initialLat] : null
  );

  useEffect(() => {
    (async () => {
      try {
        if (!hasInitialCoord) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            setCenterCoord([location.coords.longitude, location.coords.latitude]);
          } else {
            setCenterCoord(DEFAULT_CENTER);
          }
        }
      } catch (error) {
        console.warn('LOCATION_PERMISSION_ERROR', error);
        if (!hasInitialCoord) {
          setCenterCoord(DEFAULT_CENTER);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [hasInitialCoord]);

  // Ask the map for its real center at the moment of selection. Region-change
  // events are debounced (~500 ms) and not always delivered, so tracking them
  // saved a stale point when "Select" was tapped right after panning.
  const handleSelect = async () => {
    if (selecting) return;
    setSelecting(true);
    try {
      const center = (await mapRef.current?.getCenter()) ?? centerCoord;
      if (center) {
        setPickedLocation({ lat: center[1], lng: center[0] });
      }
    } catch (error) {
      console.warn('MAP_GET_CENTER_ERROR', error);
    } finally {
      setSelecting(false);
      router.back();
    }
  };

  if (loading) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('item.chooseOnMap'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={false} padded={false}>
      <Stack.Screen options={{ title: t('item.chooseOnMap'), headerBackTitle: 'Geri' }} />
      <View style={styles.container}>
        {/* The crosshair must be centered on the map only (not map + footer),
            because the selected coordinate is the map's center. */}
        <View style={styles.mapArea}>
          <Mapbox.MapView ref={mapRef} style={styles.map}>
            {centerCoord && (
              <Mapbox.Camera
                zoomLevel={12}
                centerCoordinate={centerCoord}
                animationDuration={0}
              />
            )}
          </Mapbox.MapView>

          <View style={styles.crosshairContainer} pointerEvents="none">
            <View style={[styles.crosshairVertical, { backgroundColor: theme.primary }]} />
            <View style={[styles.crosshairHorizontal, { backgroundColor: theme.primary }]} />
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Button title={t('item.selectThisLocation')} onPress={handleSelect} loading={selecting} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  crosshairContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairVertical: {
    width: 2,
    height: 20,
    position: 'absolute',
  },
  crosshairHorizontal: {
    width: 20,
    height: 2,
    position: 'absolute',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
});
