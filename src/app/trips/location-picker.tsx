import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Keyboard, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';
import { setPickedLocation } from '@/lib/locationStore';
import {
  createSearchSessionToken,
  Place,
  PlaceSuggestion,
  retrievePlace,
  suggestPlaces,
} from '@/lib/mapboxSearch';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { SearchField } from '@/components/ui/SearchField';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

initializeMapbox();

// Istanbul, used when location permission is denied or unavailable.
const DEFAULT_CENTER: [number, number] = [28.9784, 41.0082];
const SEARCH_DEBOUNCE_MS = 300;
// If the map was moved further than this after picking a search result, the
// chosen point is no longer that place, so its name isn't kept.
const PLACE_MATCH_METERS = 40;

function distanceMeters([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

export default function LocationPickerScreen() {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; name?: string; address?: string }>();
  const router = useRouter();
  const { t, language } = useTranslation();
  const theme = useTheme();

  // Read initial coordinates if provided
  // Note: 0 is a valid latitude/longitude, so check for null, not truthiness.
  const parsedLat = params.lat ? parseFloat(params.lat) : NaN;
  const parsedLng = params.lng ? parseFloat(params.lng) : NaN;
  const initialLat = Number.isFinite(parsedLat) ? parsedLat : null;
  const initialLng = Number.isFinite(parsedLng) ? parsedLng : null;
  const hasInitialCoord = initialLat !== null && initialLng !== null;

  const mapRef = useRef<Mapbox.MapView>(null);
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  // Initial camera position only; the selected point is read from the map on "Select".
  const [centerCoord, setCenterCoord] = useState<[number, number] | null>(
    hasInitialCoord ? [initialLng, initialLat] : null
  );

  // Place search (#14)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  // Query whose results are shown, so "no results" only appears after a search finished.
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(
    hasInitialCoord && params.name
      ? { name: params.name, address: params.address || null, latitude: initialLat, longitude: initialLng }
      : null
  );
  const sessionToken = useRef(createSearchSessionToken());
  // Set when the query text comes from picking a result, so it doesn't search again.
  const skipNextSearch = useRef(false);

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

  // Debounced suggestions, biased towards what the map currently shows.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    // Short queries are cleared in handleQueryChange; nothing to fetch here.
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError(false);
      try {
        const proximity = ((await mapRef.current?.getCenter()) ?? centerCoord ?? undefined) as
          | [number, number]
          | undefined;
        const results = await suggestPlaces(query, {
          sessionToken: sessionToken.current,
          language,
          proximity,
          signal: controller.signal,
        });
        setSuggestions(results);
        setResultsFor(query.trim());
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('PLACE_SEARCH_ERROR', error);
          setSearchError(true);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, language, centerCoord]);

  const handlePickSuggestion = async (suggestion: PlaceSuggestion) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setSearching(true);
    try {
      const place = await retrievePlace(suggestion.id, { sessionToken: sessionToken.current, language });
      if (!place) {
        setSearchError(true);
        return;
      }
      setSelectedPlace(place);
      setResultsFor(null);
      skipNextSearch.current = true;
      setQuery(place.name);
      cameraRef.current?.setCamera({
        centerCoordinate: [place.longitude, place.latitude],
        zoomLevel: 16,
        animationDuration: 600,
      });
    } catch (error) {
      console.warn('PLACE_RETRIEVE_ERROR', error);
      setSearchError(true);
    } finally {
      // A retrieve ends the billing session; the next search starts a new one.
      sessionToken.current = createSearchSessionToken();
      setSearching(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setSearchError(false);
      setResultsFor(null);
    }
    if (!text) setSelectedPlace(null);
  };

  // Ask the map for its real center at the moment of selection. Region-change
  // events are debounced (~500 ms) and not always delivered, so tracking them
  // saved a stale point when "Select" was tapped right after panning.
  const handleSelect = async () => {
    if (selecting) return;
    setSelecting(true);
    try {
      const center = ((await mapRef.current?.getCenter()) ?? centerCoord) as [number, number] | null;
      if (center) {
        const keepPlace =
          selectedPlace !== null &&
          distanceMeters(center, [selectedPlace.longitude, selectedPlace.latitude]) <= PLACE_MATCH_METERS;
        setPickedLocation({
          lat: center[1],
          lng: center[0],
          ...(keepPlace ? { name: selectedPlace.name, address: selectedPlace.address } : {}),
        });
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
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('item.chooseOnMap') }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  const showResults =
    searching || searchError || suggestions.length > 0 || (resultsFor !== null && resultsFor === query.trim());

  return (
    <Screen safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('item.chooseOnMap') }} />
      <View style={styles.container}>
        {/* The crosshair must be centered on the map only (not map + footer),
            because the selected coordinate is the map's center. */}
        <View style={styles.mapArea}>
          <Mapbox.MapView ref={mapRef} style={styles.map} onPress={() => Keyboard.dismiss()}>
            {centerCoord && (
              <Mapbox.Camera
                ref={cameraRef}
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

          <View style={styles.searchOverlay} pointerEvents="box-none">
            <SearchField
              value={query}
              onChangeText={handleQueryChange}
              placeholder={t('item.searchPlace')}
              clearLabel={t('common.clear')}
            />

            {showResults && (
              <View style={[styles.results, { backgroundColor: theme.background, borderColor: theme.border }]}>
                {searching ? (
                  <ActivityIndicator style={styles.resultsMessage} color={theme.primary} />
                ) : searchError ? (
                  <ThemedText type="small" themeColor="error" style={styles.resultsMessage}>
                    {t('item.searchError')}
                  </ThemedText>
                ) : suggestions.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.resultsMessage}>
                    {t('item.noResults')}
                  </ThemedText>
                ) : (
                  <FlatList
                    data={suggestions}
                    keyExtractor={(s) => s.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.resultRow, { borderBottomColor: theme.border }]}
                        onPress={() => handlePickSuggestion(item)}
                      >
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        {item.address ? (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                            {item.address}
                          </ThemedText>
                        ) : null}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          {selectedPlace && (
            <View style={styles.selectedPlace}>
              <ThemedText type="smallBold" numberOfLines={1}>
                📍 {selectedPlace.name}
              </ThemedText>
              {selectedPlace.address ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {selectedPlace.address}
                </ThemedText>
              ) : null}
            </View>
          )}
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
  searchOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  results: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 280,
    overflow: 'hidden',
  },
  resultsMessage: {
    padding: 14,
    textAlign: 'center',
  },
  resultRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  selectedPlace: {
    gap: 2,
  },
});
