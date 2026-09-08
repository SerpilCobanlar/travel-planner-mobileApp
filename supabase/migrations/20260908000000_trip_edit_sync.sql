-- Migration: Trip Edit Date Range Sync
-- Description: Adds a trigger to automatically sync trip_days when start_date or end_date is updated.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.sync_trip_days_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day date;
  v_day_num int;
  v_items_count int;
BEGIN
  -- Only act if dates actually changed
  IF NEW.start_date = OLD.start_date AND NEW.end_date = OLD.end_date THEN
    RETURN NEW;
  END IF;

  -- Validate dates
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date cannot be before start_date';
  END IF;

  -- 1. Check for items outside the new range
  SELECT count(*)
  INTO v_items_count
  FROM public.trip_days td
  JOIN public.trip_items ti ON td.id = ti.trip_day_id
  WHERE td.trip_id = NEW.id
    AND (td.day_date < NEW.start_date OR td.day_date > NEW.end_date);

  IF v_items_count > 0 THEN
    RAISE EXCEPTION 'DATE_RANGE_REJECTED_HAS_ITEMS';
  END IF;

  -- 2. Delete out-of-range days
  DELETE FROM public.trip_days
  WHERE trip_id = NEW.id
    AND (day_date < NEW.start_date OR day_date > NEW.end_date);

  -- 3. Temporarily shift day_number for remaining days to avoid unique constraint violations
  -- during the update phase. We add a large offset to stay above the > 0 constraint.
  UPDATE public.trip_days
  SET day_number = day_number + 10000
  WHERE trip_id = NEW.id;

  -- 4. Upsert days for the new range
  FOR v_day IN 
    SELECT generate_series(NEW.start_date::timestamp, NEW.end_date::timestamp, '1 day'::interval)::date
  LOOP
    v_day_num := (v_day - NEW.start_date) + 1;
    
    INSERT INTO public.trip_days (trip_id, day_number, day_date)
    VALUES (NEW.id, v_day_num, v_day)
    ON CONFLICT (trip_id, day_date)
    DO UPDATE SET day_number = EXCLUDED.day_number;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_trips_sync_days ON public.trips;
CREATE TRIGGER tr_trips_sync_days
  AFTER UPDATE OF start_date, end_date ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trip_days_on_update();
