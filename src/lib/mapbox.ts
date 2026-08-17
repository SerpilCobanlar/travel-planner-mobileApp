import Mapbox from '@rnmapbox/maps';

export function initializeMapbox() {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    console.error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is not set in environment variables.');
    return;
  }

  Mapbox.setAccessToken(token);
}

export default Mapbox;
