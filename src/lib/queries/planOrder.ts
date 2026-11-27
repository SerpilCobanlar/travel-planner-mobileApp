/**
 * Reordering plans and moving them between days (#15).
 *
 * Both update the shared items cache right away (the list doesn't jump back
 * while saving) and roll back if the write fails.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { orderTripItems } from '@/lib/planOrder';
import { shiftToDay } from '@/lib/date';
import { NoRowsAffectedError, tripKeys, type TripDay, type TripItem } from '@/lib/queries/trips';

type SortOrderUpdate = { id: string; sort_order: number };

async function updateItem(tripId: string, itemId: string, values: Partial<TripItem>) {
  const { data, error } = await supabase
    .from('trip_items')
    .update(values)
    .eq('id', itemId)
    .eq('trip_id', tripId)
    .select('id');
  if (error) throw error;
  // RLS-blocked updates don't error; they just affect 0 rows.
  if (!data || data.length === 0) throw new NoRowsAffectedError();
}

function useOptimisticItems(tripId: string) {
  const queryClient = useQueryClient();
  const key = tripKeys.items(tripId);

  return {
    /** Apply a change to the cached items; returns the previous value for rollback. */
    apply: async (change: (items: TripItem[]) => TripItem[]) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripItem[]>(key);
      queryClient.setQueryData<TripItem[]>(key, (items) => (items ? orderTripItems(change(items)) : items));
      return { previous };
    },
    rollback: (context: { previous?: TripItem[] } | undefined) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    // Discover pins and day previews depend on the order too.
    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) }),
        queryClient.invalidateQueries({ queryKey: tripKeys.lists() }),
      ]),
  };
}

/** Save a new order for a day's plans (only the changed `sort_order`s are sent). */
export function useReorderDayItems(tripId: string) {
  const cache = useOptimisticItems(tripId);

  return useMutation({
    mutationFn: async (updates: SortOrderUpdate[]) => {
      await Promise.all(updates.map(({ id, sort_order }) => updateItem(tripId, id, { sort_order })));
    },
    onMutate: (updates) => {
      const newOrder = new Map(updates.map((u) => [u.id, u.sort_order]));
      return cache.apply((items) =>
        items.map((item) => (newOrder.has(item.id) ? { ...item, sort_order: newOrder.get(item.id)! } : item))
      );
    },
    onError: (_error, _updates, context) => cache.rollback(context),
    onSettled: cache.refresh,
  });
}

export interface MoveItemInput {
  item: TripItem;
  fromDay: TripDay;
  toDay: TripDay;
}

/**
 * Move a plan to another day: it goes to the end of that day, keeping its
 * time of day (timed plans then fall into place by time).
 */
export function useMoveTripItem(tripId: string) {
  const queryClient = useQueryClient();
  const cache = useOptimisticItems(tripId);

  const valuesFor = ({ item, fromDay, toDay }: MoveItemInput): Partial<TripItem> => {
    const targetItems = (queryClient.getQueryData<TripItem[]>(tripKeys.items(tripId)) ?? []).filter(
      (i) => i.trip_day_id === toDay.id
    );
    const lastSortOrder = targetItems.reduce((max, i) => Math.max(max, i.sort_order), -1);
    return {
      trip_day_id: toDay.id,
      sort_order: lastSortOrder + 1,
      start_at: shiftToDay(item.start_at, fromDay.day_date, toDay.day_date),
      end_at: shiftToDay(item.end_at, fromDay.day_date, toDay.day_date),
    };
  };

  const mutation = useMutation({
    mutationFn: ({ itemId, values }: { itemId: string; values: Partial<TripItem> }) =>
      updateItem(tripId, itemId, values),
    onMutate: ({ itemId, values }) =>
      cache.apply((items) => items.map((i) => (i.id === itemId ? { ...i, ...values } : i))),
    onError: (_error, _variables, context) => cache.rollback(context),
    onSettled: cache.refresh,
  });

  return {
    isPending: mutation.isPending,
    // Values are computed once, before the optimistic update moves the plan in the cache.
    move: (input: MoveItemInput, options?: { onError?: (error: Error) => void }) =>
      mutation.mutate({ itemId: input.item.id, values: valuesFor(input) }, options),
  };
}
