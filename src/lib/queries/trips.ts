/**
 * Trip data queries and mutations (#33).
 *
 * All trip screens read from the same cache, so moving between the trip,
 * day and map screens is instant, and a change in one place (e.g. deleting a
 * plan) shows up everywhere. Writes invalidate the affected keys.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { getMyTripRole, TripRole } from '@/lib/tripMembers';
import type { Database } from '@/types/database.types';

export type Trip = Database['public']['Tables']['trips']['Row'];
export type TripDay = Database['public']['Tables']['trip_days']['Row'];
export type TripItem = Database['public']['Tables']['trip_items']['Row'];
export type TripListKind = 'mine' | 'public';

export const tripKeys = {
  /** Prefix for both trip lists (invalidate after create/update/delete). */
  lists: () => ['trips'] as const,
  list: (kind: TripListKind, userId: string | undefined) => ['trips', kind, userId ?? 'anon'] as const,
  /** Prefix for everything about one trip (trip row, days, items, my role). */
  detail: (tripId: string) => ['trip', tripId] as const,
  trip: (tripId: string) => ['trip', tripId, 'row'] as const,
  days: (tripId: string) => ['trip', tripId, 'days'] as const,
  items: (tripId: string) => ['trip', tripId, 'items'] as const,
  role: (tripId: string, userId: string | undefined) => ['trip', tripId, 'role', userId ?? 'anon'] as const,
  profile: (userId: string) => ['profile', userId] as const,
};

/** Thrown when RLS silently matched 0 rows on a write. */
export class NoRowsAffectedError extends Error {
  constructor() {
    super('NO_ROWS_AFFECTED');
    this.name = 'NoRowsAffectedError';
  }
}

// ---------- Fetchers ----------

async function fetchTrips(kind: TripListKind, userId: string | undefined): Promise<Trip[]> {
  let query = supabase.from('trips').select('*');

  if (kind === 'mine') {
    if (!userId) return [];
    query = query.eq('owner_id', userId);
  } else {
    query = query.eq('is_public', true);
    if (userId) query = query.neq('owner_id', userId);
  }

  const { data, error } = await query.order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchTrip(tripId: string): Promise<Trip> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).single();
  if (error) throw error;
  return data;
}

async function fetchTripDays(tripId: string): Promise<TripDay[]> {
  const { data, error } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** All plans of a trip, timed ones first, then by manual order. Screens filter by day. */
async function fetchTripItems(tripId: string): Promise<TripItem[]> {
  const { data, error } = await supabase
    .from('trip_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_at', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- Queries ----------

export function useTrips(kind: TripListKind, userId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.list(kind, userId),
    queryFn: () => fetchTrips(kind, userId),
  });
}

export function useTrip(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.trip(tripId ?? ''),
    queryFn: () => fetchTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useTripDays(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.days(tripId ?? ''),
    queryFn: () => fetchTripDays(tripId!),
    enabled: !!tripId,
  });
}

export function useTripItems(tripId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.items(tripId ?? ''),
    queryFn: () => fetchTripItems(tripId!),
    enabled: !!tripId,
  });
}

/** The signed-in user's role in the trip (null = not a member, e.g. viewing a public trip). */
export function useMyTripRole(tripId: string | undefined, userId: string | undefined) {
  return useQuery<TripRole | null>({
    queryKey: tripKeys.role(tripId ?? '', userId),
    queryFn: () => getMyTripRole(tripId!),
    enabled: !!tripId && !!userId,
  });
}

export function useProfileUsername(userId: string | undefined) {
  return useQuery({
    queryKey: tripKeys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('username').eq('id', userId!).single();
      if (error) throw error;
      return data.username;
    },
    enabled: !!userId,
  });
}

// ---------- Cache helpers for screens that write ----------

/** Call after creating/updating/deleting something in a trip. */
export function useInvalidateTrip() {
  const queryClient = useQueryClient();
  return (tripId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) }),
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() }),
    ]);
}

// ---------- Mutations ----------

/** Delete a plan; removes it from every screen immediately and rolls back on failure. */
export function useDeleteTripItem(tripId: string) {
  const queryClient = useQueryClient();
  const key = tripKeys.items(tripId);

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase
        .from('trip_items')
        .delete()
        .eq('id', itemId)
        .eq('trip_id', tripId)
        .select('id');
      if (error) throw error;
      // RLS-blocked deletes don't error; they just affect 0 rows.
      if (!data || data.length === 0) throw new NoRowsAffectedError();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripItem[]>(key);
      queryClient.setQueryData<TripItem[]>(key, (items) => items?.filter((i) => i.id !== itemId));
      return { previous };
    },
    onError: (_error, _itemId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** Delete a whole trip (owner only). */
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { data, error } = await supabase.from('trips').delete().eq('id', tripId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) throw new NoRowsAffectedError();
    },
    onSuccess: (_data, tripId) => {
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      return queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
