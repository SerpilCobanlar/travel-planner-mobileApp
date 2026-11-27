-- #15: Plan order becomes manual (sort_order), with timed plans kept in time
-- order and untimed plans staying after the plan stored before them
-- (see src/lib/planOrder.ts).
--
-- Until now the app showed timed plans first (by time) and untimed plans after
-- them (by sort_order), while sort_order itself was just the creation order.
-- Rewrite sort_order once so every existing day keeps exactly the order it
-- shows today under the new rule.
--
-- Safe to apply before the app update: the old app orders by
-- start_at, then sort_order, which this numbering preserves.

WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY trip_day_id
            ORDER BY start_at ASC NULLS LAST, sort_order ASC, created_at ASC
        ) - 1 AS new_sort_order
    FROM public.trip_items
)
UPDATE public.trip_items AS ti
SET sort_order = ranked.new_sort_order
FROM ranked
WHERE ti.id = ranked.id
  AND ti.sort_order IS DISTINCT FROM ranked.new_sort_order;
