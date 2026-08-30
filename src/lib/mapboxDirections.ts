export type DirectionProfile = 'walking' | 'driving';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface RouteResponse {
  geometry: RouteGeometry;
  distance: number; // in meters
  duration: number; // in seconds
}

export async function fetchDirections(
  profile: DirectionProfile,
  coordinates: [number, number][]
): Promise<RouteResponse | null> {
  if (coordinates.length < 2) return null;
  if (coordinates.length > 25) {
    throw new Error('TooManyWaypoints');
  }

  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MissingMapboxToken');
  }

  // format coordinates: lng,lat;lng,lat
  const coordString = coordinates.map((c) => `${c[0]},${c[1]}`).join(';');
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordString}?geometries=geojson&overview=full&steps=false&alternatives=false&access_token=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.warn('MAPBOX_DIRECTIONS_ERROR', data);
      throw new Error(data.message || 'Mapbox API Error');
    }

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
      };
    }

    return null;
  } catch (error) {
    console.warn('MAPBOX_DIRECTIONS_ERROR', error);
    throw error;
  }
}
