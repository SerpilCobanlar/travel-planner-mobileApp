/**
 * Place search with the Mapbox Search Box API (#14).
 * https://docs.mapbox.com/api/search/search-box/
 *
 * Interactive flow: /suggest while the user types (no coordinates), then
 * /retrieve for the chosen suggestion (coordinates). Calls that share a
 * session_token are billed as ONE session, so use one token per search and
 * start a new one after a retrieve.
 */

const BASE_URL = 'https://api.mapbox.com/search/searchbox/v1';

export interface PlaceSuggestion {
  id: string;
  name: string;
  /** Address or "city, country" line to tell similar names apart. */
  address: string | null;
  featureType: string;
}

export interface Place {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
}

/** RFC 4122 v4-style id; only used to group requests for billing. */
export function createSearchSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getToken(): string {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error('MissingMapboxToken');
  return token;
}

interface SuggestResponse {
  suggestions?: {
    mapbox_id: string;
    name: string;
    feature_type: string;
    full_address?: string;
    place_formatted?: string;
  }[];
}

interface RetrieveResponse {
  features?: {
    geometry: { coordinates: [number, number] };
    properties: { name: string; full_address?: string; place_formatted?: string };
  }[];
}

export async function suggestPlaces(
  query: string,
  options: {
    sessionToken: string;
    language: string;
    /** [longitude, latitude] to favor nearby results (e.g. the map center). */
    proximity?: [number, number];
    signal?: AbortSignal;
  }
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed.slice(0, 256),
    session_token: options.sessionToken,
    language: options.language,
    limit: '8',
    access_token: getToken(),
  });
  if (options.proximity) params.set('proximity', options.proximity.join(','));

  const response = await fetch(`${BASE_URL}/suggest?${params}`, { signal: options.signal });
  if (!response.ok) throw new Error(`MapboxSuggestError ${response.status}`);
  const data = (await response.json()) as SuggestResponse;

  return (data.suggestions ?? [])
    // Categories ("cafe") are not places you can pin.
    .filter((s) => s.feature_type !== 'category')
    .map((s) => ({
      id: s.mapbox_id,
      name: s.name,
      address: s.full_address ?? s.place_formatted ?? null,
      featureType: s.feature_type,
    }));
}

export async function retrievePlace(
  id: string,
  options: { sessionToken: string; language: string }
): Promise<Place | null> {
  const params = new URLSearchParams({
    session_token: options.sessionToken,
    language: options.language,
    access_token: getToken(),
  });

  const response = await fetch(`${BASE_URL}/retrieve/${encodeURIComponent(id)}?${params}`);
  if (!response.ok) throw new Error(`MapboxRetrieveError ${response.status}`);
  const data = (await response.json()) as RetrieveResponse;

  const feature = data.features?.[0];
  if (!feature) return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    name: feature.properties.name,
    address: feature.properties.full_address ?? feature.properties.place_formatted ?? null,
    latitude,
    longitude,
  };
}
