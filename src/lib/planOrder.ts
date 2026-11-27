/**
 * Plan order within a day (#15).
 *
 * Rule (agreed in #15):
 * - Timed plans always follow their time order; they can't pass each other.
 * - An untimed plan stays right after the plan stored before it (its "anchor").
 *   Drop "Lunch" after the 10:00 museum and it stays after the museum, even if a
 *   12:00 plan is added later. Untimed plans stored before any timed plan come first.
 *
 * `sort_order` stores the manual order. Every screen (day list, day map and
 * route, trip day previews, Discover pins) reads plans through `orderTripItems`,
 * so they all agree.
 */

interface OrderablePlan {
  id: string;
  trip_day_id: string | null;
  start_at: string | null;
  sort_order: number;
  created_at: string;
}

function timeOf(plan: OrderablePlan): number {
  return plan.start_at ? Date.parse(plan.start_at) : Number.NaN;
}

function byStoredOrder(a: OrderablePlan, b: OrderablePlan): number {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
}

/** Order the plans of a single day. */
export function orderDayItems<T extends OrderablePlan>(items: T[]): T[] {
  const leading: T[] = [];
  const groups: { timed: T; followers: T[] }[] = [];

  for (const item of [...items].sort(byStoredOrder)) {
    if (item.start_at) groups.push({ timed: item, followers: [] });
    else if (groups.length > 0) groups[groups.length - 1].followers.push(item);
    else leading.push(item);
  }

  // Stable sort: equal times keep their stored order.
  groups.sort((a, b) => timeOf(a.timed) - timeOf(b.timed));
  return [...leading, ...groups.flatMap((group) => [group.timed, ...group.followers])];
}

/** Order all plans of a trip, day by day (days keep their first-seen order). */
export function orderTripItems<T extends OrderablePlan>(items: T[]): T[] {
  const byDay = new Map<string | null, T[]>();
  for (const item of items) {
    const dayItems = byDay.get(item.trip_day_id);
    if (dayItems) dayItems.push(item);
    else byDay.set(item.trip_day_id, [item]);
  }
  return [...byDay.values()].flatMap(orderDayItems);
}

/** True if the timed plans in this sequence are in time order (untimed ones are free). */
export function isValidDayOrder(items: OrderablePlan[]): boolean {
  let lastTime = -Infinity;
  for (const item of items) {
    if (!item.start_at) continue;
    const time = timeOf(item);
    if (time < lastTime) return false;
    lastTime = time;
  }
  return true;
}

/** `sort_order` = position, only for the plans whose value changes. */
export function renumberDayItems(items: OrderablePlan[]): { id: string; sort_order: number }[] {
  return items
    .map((item, index) => ({ id: item.id, sort_order: index, changed: item.sort_order !== index }))
    .filter((entry) => entry.changed)
    .map(({ id, sort_order }) => ({ id, sort_order }));
}
