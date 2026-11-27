/**
 * Discover tab data (#18): other users' public trips, each with a map pin.
 *
 * Trips have no location of their own, so a trip's pin is its first plan that
 * has coordinates: earliest day first, then the day's plan order (`planOrder.ts`),
 * the same order the day screen shows.
 *
 * The key lives under `tripKeys.lists()`, so any trip/plan change that already
 * invalidates the trip lists refreshes Discover too.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { tripKeys, type Trip } from '@/lib/queries/trips';
import { orderDayItems } from '@/lib/planOrder';

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

interface PlanRow {
  id: string;
  trip_id: string;
  trip_day_id: string | null;
  latitude: number | null;
  longitude: number | null;
  start_at: string | null;
  sort_order: number;
  created_at: string;
}

/** [lng, lat] of the first located plan, going day by day in plan order. */
function firstLocation(plans: PlanRow[], dayNumbers: Map<string, number>): [number, number] | null {
  const byDay = new Map<string | null, PlanRow[]>();
  for (const plan of plans) byDay.set(plan.trip_day_id, [...(byDay.get(plan.trip_day_id) ?? []), plan]);

  const dayRank = (dayId: string | null) => (dayId ? (dayNumbers.get(dayId) ?? Infinity) : Infinity);
  const days = [...byDay.keys()].sort((a, b) => dayRank(a) - dayRank(b));

  for (const dayId of days) {
    const located = orderDayItems(byDay.get(dayId) ?? []).find(
      (plan) => plan.latitude !== null && plan.longitude !== null
    );
    if (located) return [located.longitude!, located.latitude!];
  }
  return null;
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
    // All plans, not only located ones: untimed plans' position depends on the plans before them.
    supabase
      .from('trip_items')
      .select('id, trip_id, trip_day_id, latitude, longitude, start_at, sort_order, created_at')
      .in('trip_id', tripIds),
    supabase.from('profiles').select('id, username').in('id', ownerIds),
  ]);
  if (daysResult.error) throw daysResult.error;
  if (itemsResult.error) throw itemsResult.error;
  // Usernames are a nice-to-have; don't fail the whole tab if profiles can't be read.
  if (profilesResult.error) console.error('DISCOVER_PROFILES_ERROR', profilesResult.error);

  const dayNumbers = new Map((daysResult.data ?? []).map((day) => [day.id, day.day_number]));
  const usernames = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.username]));

  const plansByTrip = new Map<string, PlanRow[]>();
  for (const plan of itemsResult.data ?? []) {
    plansByTrip.set(plan.trip_id, [...(plansByTrip.get(plan.trip_id) ?? []), plan]);
  }

  return trips.map((trip) => ({
    trip,
    start: firstLocation(plansByTrip.get(trip.id) ?? [], dayNumbers),
    ownerUsername: usernames.get(trip.owner_id) ?? null,
  }));
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
