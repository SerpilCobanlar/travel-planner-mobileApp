/**
 * Discover tab data (#18): other users' public trips, each with a map pin.
 *
 * Trips have no location of their own, so a trip's pin is its first plan that
 * has coordinates: earliest day, then earliest time (untimed last), then manual
 * order. This matches how the day screen orders plans.
 *
 * The key lives under `tripKeys.lists()`, so any trip/plan change that already
 * invalidates the trip lists refreshes Discover too.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { tripKeys, type Trip } from '@/lib/queries/trips';

const MAX_DISCOVER_TRIPS = 100;

export interface DiscoverTrip {
  trip: Trip;
  /** [longitude, latitude] of the trip's first located plan; null if no plan has a location. */
  start: [number, number] | null;
  /** Owner's username, shown on the card; null if the profile couldn't be read. */
  ownerUsername: string | null;
}

export const discoverKeys = {
  list: (userId: string | undefined) => [...tripKeys.lists(), 'discover', userId ?? 'anon'] as const,
};

interface LocatedItem {
  trip_id: string;
  trip_day_id: string | null;
  latitude: number;
  longitude: number;
  start_at: string | null;
  sort_order: number;
}

function compareItems(a: LocatedItem, b: LocatedItem, dayNumbers: Map<string, number>): number {
  const dayA = a.trip_day_id ? (dayNumbers.get(a.trip_day_id) ?? Infinity) : Infinity;
  const dayB = b.trip_day_id ? (dayNumbers.get(b.trip_day_id) ?? Infinity) : Infinity;
  if (dayA !== dayB) return dayA - dayB;

  if (a.start_at !== b.start_at) {
    if (a.start_at === null) return 1;
    if (b.start_at === null) return -1;
    return a.start_at < b.start_at ? -1 : 1;
  }

  return a.sort_order - b.sort_order;
}

async function fetchDiscoverTrips(userId: string | undefined): Promise<DiscoverTrip[]> {
  let tripQuery = supabase.from('trips').select('*').eq('is_public', true);
  if (userId) tripQuery = tripQuery.neq('owner_id', userId);

  const { data: trips, error } = await tripQuery
    .order('start_date', { ascending: true })
    .limit(MAX_DISCOVER_TRIPS);
  if (error) throw error;
  if (!trips || trips.length === 0) return [];

  const tripIds = trips.map((trip) => trip.id);
  const ownerIds = [...new Set(trips.map((trip) => trip.owner_id))];
  const [daysResult, itemsResult, profilesResult] = await Promise.all([
    supabase.from('trip_days').select('id, day_number').in('trip_id', tripIds),
    supabase
      .from('trip_items')
      .select('trip_id, trip_day_id, latitude, longitude, start_at, sort_order')
      .in('trip_id', tripIds)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
    supabase.from('profiles').select('id, username').in('id', ownerIds),
  ]);
  if (daysResult.error) throw daysResult.error;
  if (itemsResult.error) throw itemsResult.error;
  // Usernames are a nice-to-have; don't fail the whole tab if profiles can't be read.
  if (profilesResult.error) console.error('DISCOVER_PROFILES_ERROR', profilesResult.error);

  const dayNumbers = new Map((daysResult.data ?? []).map((day) => [day.id, day.day_number]));
  const usernames = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.username]));

  const firstItemByTrip = new Map<string, LocatedItem>();
  for (const row of itemsResult.data ?? []) {
    // Filtered to non-null above; the check narrows the generated nullable types.
    if (row.latitude === null || row.longitude === null) continue;
    const item: LocatedItem = { ...row, latitude: row.latitude, longitude: row.longitude };
    const current = firstItemByTrip.get(item.trip_id);
    if (!current || compareItems(item, current, dayNumbers) < 0) {
      firstItemByTrip.set(item.trip_id, item);
    }
  }

  return trips.map((trip) => {
    const first = firstItemByTrip.get(trip.id);
    return {
      trip,
      start: first ? [first.longitude, first.latitude] : null,
      ownerUsername: usernames.get(trip.owner_id) ?? null,
    };
  });
}

/** Case-insensitive (Turkish-aware) match on title, description and owner username. */
export function filterDiscoverTrips(trips: DiscoverTrip[], search: string): DiscoverTrip[] {
  const needle = search.trim().toLocaleLowerCase('tr');
  if (!needle) return trips;
  return trips.filter(({ trip, ownerUsername }) =>
    [trip.title, trip.description, ownerUsername].some((field) =>
      field?.toLocaleLowerCase('tr').includes(needle)
    )
  );
}

export function useDiscoverTrips(userId: string | undefined) {
  return useQuery({
    queryKey: discoverKeys.list(userId),
    queryFn: () => fetchDiscoverTrips(userId),
  });
}
