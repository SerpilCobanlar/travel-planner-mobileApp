import React, { useState, useEffect } from 'react';
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

export default function LocationPickerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  // Read initial coordinates if provided
  const initialLat = params.lat ? parseFloat(params.lat as string) : null;
  const initialLng = params.lng ? parseFloat(params.lng as string) : null;

  const [loading, setLoading] = useState(true);
  const [centerCoord, setCenterCoord] = useState<[number, number] | null>(
    initialLng && initialLat ? [initialLng, initialLat] : null
  );
  
  // The coordinate to return when user clicks 'Select'
  const [selectedCoord, setSelectedCoord] = useState<[number, number] | null>(
    initialLng && initialLat ? [initialLng, initialLat] : null
  );

  useEffect(() => {
    (async () => {
      try {
        if (!initialLat || !initialLng) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            setCenterCoord([location.coords.longitude, location.coords.latitude]);
            setSelectedCoord([location.coords.longitude, location.coords.latitude]);
          } else {
            // Default to Istanbul
            setCenterCoord([28.9784, 41.0082]);
            setSelectedCoord([28.9784, 41.0082]);
          }
        }
      } catch (error) {
        console.warn('LOCATION_PERMISSION_ERROR', error);
        // Default on error
        if (!initialLat || !initialLng) {
          setCenterCoord([28.9784, 41.0082]);
          setSelectedCoord([28.9784, 41.0082]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [initialLat, initialLng]);

  const handleRegionDidChange = (e: any) => {
    if (e?.geometry?.coordinates) {
      setSelectedCoord(e.geometry.coordinates);
    }
  };

  const handleSelect = () => {
    if (selectedCoord) {
      setPickedLocation({
        lat: selectedCoord[1],
        lng: selectedCoord[0],
      });
    }
    router.back();
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
        <Mapbox.MapView style={styles.map} onRegionDidChange={handleRegionDidChange}>
          {centerCoord && (
            <Mapbox.Camera
              zoomLevel={12}
              centerCoordinate={centerCoord}
              animationDuration={0}
            />
          )}
        </Mapbox.MapView>
        
        {/* Fixed Crosshair */}
        <View style={styles.crosshairContainer} pointerEvents="none">
          <View style={[styles.crosshairVertical, { backgroundColor: theme.primary }]} />
          <View style={[styles.crosshairHorizontal, { backgroundColor: theme.primary }]} />
        </View>

        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Button title={t('item.selectThisLocation')} onPress={handleSelect} />
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
