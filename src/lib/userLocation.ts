/**
 * The device's current position for map screens.
 * Uses the last known fix when available (instant), otherwise asks for a fresh one.
 */
import * as Location from 'expo-location';

export type UserLocationResult =
  | { status: 'granted'; coordinate: [number, number] } // [longitude, latitude]
  /** The user didn't give the app location permission. */
  | { status: 'denied' }
  /** Permission is fine, but the phone's location is off (or the "turn on location" prompt was declined). */
  | { status: 'services-off' };

export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/** Android throws these when location services are off or their prompt is dismissed. */
function isLocationSettingsError(error: unknown): boolean {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  return code.includes('SETTINGS_UNSATISFIED') || code.includes('REQUEST_CANCELLED');
}

export async function getUserLocation(): Promise<UserLocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { status: 'denied' };

  if (!(await Location.hasServicesEnabledAsync())) return { status: 'services-off' };

  try {
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { status: 'granted', coordinate: [position.coords.longitude, position.coords.latitude] };
  } catch (error) {
    if (isLocationSettingsError(error)) return { status: 'services-off' };
    throw error;
  }
}
