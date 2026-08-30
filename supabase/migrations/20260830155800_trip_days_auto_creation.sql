-- Migration: Trip Days Auto Creation and Backfill
-- Description: Automatically generates trip_days records when a new trip is created. Backfills existing trips.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.create_trip_days()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day date;
  v_day_num int := 1;
BEGIN
  -- Validate dates
  IF NEW.start_date IS NULL OR NEW.end_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- End date must be >= start date
  IF NEW.end_date < NEW.start_date THEN
    RETURN NEW;
  END IF;

  -- Generate and insert days
  FOR v_day IN 
    SELECT generate_series(NEW.start_date::timestamp, NEW.end_date::timestamp, '1 day'::interval)::date
  LOOP
    INSERT INTO public.trip_days (trip_id, day_number, day_date)
    VALUES (NEW.id, v_day_num, v_day)
    ON CONFLICT DO NOTHING;
    
    v_day_num := v_day_num + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_trips_auto_days ON public.trips;
CREATE TRIGGER tr_trips_auto_days
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trip_days();

-- 3. Backfill existing trips
DO $$
DECLARE
  r RECORD;
  v_day date;
  v_day_num int;
BEGIN
  FOR r IN 
    SELECT id, start_date, end_date 
    FROM public.trips 
    WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date
  LOOP
    v_day_num := 1;
    FOR v_day IN 
      SELECT generate_series(r.start_date::timestamp, r.end_date::timestamp, '1 day'::interval)::date
    LOOP
      INSERT INTO public.trip_days (trip_id, day_number, day_date)
      VALUES (r.id, v_day_num, v_day)
      ON CONFLICT DO NOTHING;
      
      v_day_num := v_day_num + 1;
    END LOOP;
  END LOOP;
END;
$$;
