-- Migration: Evolve Trip Data Model

-- 1. Preconditions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.trips WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot migrate: Found trips with NULL user_id. Please assign an owner or delete them first.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.trip_stops WHERE trip_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot migrate: Found trip_stops with NULL trip_id.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.trip_stops WHERE day_number <= 0) THEN
        RAISE EXCEPTION 'Cannot migrate: Found trip_stops with day_number <= 0.';
    END IF;
END $$;

-- 2. Add set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Evolve public.trips
ALTER TABLE public.trips
    RENAME COLUMN user_id TO owner_id;

ALTER TABLE public.trips
    ALTER COLUMN owner_id SET NOT NULL;

-- Rename constraint (assumes default name 'trips_user_id_fkey')
ALTER TABLE public.trips
    RENAME CONSTRAINT trips_user_id_fkey TO trips_owner_id_fkey;

ALTER TABLE public.trips
    ADD COLUMN updated_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE public.trips
    ADD CONSTRAINT trips_date_check CHECK (start_date <= end_date);

CREATE TRIGGER trips_updated_at_trigger
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. Create public.trip_members
CREATE TABLE public.trip_members (
    trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (trip_id, user_id)
);

ALTER TABLE public.trip_members OWNER TO postgres;

-- 5. Create public.trip_days
CREATE TABLE public.trip_days (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number integer NOT NULL CHECK (day_number > 0),
    day_date date NOT NULL,
    title text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (trip_id, day_number),
    UNIQUE (trip_id, day_date),
    UNIQUE (id, trip_id)
);

ALTER TABLE public.trip_days OWNER TO postgres;

CREATE TRIGGER trip_days_updated_at_trigger
    BEFORE UPDATE ON public.trip_days
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 6. Create public.trip_items
CREATE TABLE public.trip_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    trip_day_id uuid,
    type text NOT NULL CHECK (type IN ('place', 'restaurant', 'accommodation', 'transport', 'flight', 'train', 'bus', 'car', 'activity', 'note')),
    title text NOT NULL,
    notes text,
    latitude double precision CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude double precision CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    cost numeric(12,2) CHECK (cost IS NULL OR cost >= 0),
    currency text CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
    sort_order integer DEFAULT 0 NOT NULL CHECK (sort_order >= 0),
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (trip_day_id, trip_id) REFERENCES public.trip_days(id, trip_id) ON DELETE CASCADE,
    CHECK (end_at IS NULL OR start_at IS NULL OR start_at <= end_at)
);

ALTER TABLE public.trip_items OWNER TO postgres;

CREATE TRIGGER trip_items_updated_at_trigger
    BEFORE UPDATE ON public.trip_items
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 7. Data Migration

-- 7.1. Populate trip_days from trip_stops
INSERT INTO public.trip_days (trip_id, day_number, day_date)
SELECT DISTINCT 
    ts.trip_id, 
    ts.day_number, 
    t.start_date + (ts.day_number - 1)
FROM public.trip_stops ts
JOIN public.trips t ON ts.trip_id = t.id;

-- 7.2. Populate trip_items from trip_stops
INSERT INTO public.trip_items (
    trip_id,
    trip_day_id,
    type,
    title,
    notes,
    latitude,
    longitude,
    start_at,
    end_at,
    cost,
    currency,
    details,
    sort_order
)
SELECT 
    ts.trip_id,
    td.id,
    CASE ts.stop_type
        WHEN 'food' THEN 'restaurant'
        WHEN 'accommodation' THEN 'accommodation'
        WHEN 'activity' THEN 'activity'
        WHEN 'transport' THEN 'transport'
        ELSE 'place'
    END,
    ts.title,
    ts.notes,
    ts.latitude,
    ts.longitude,
    ts.start_time,
    ts.end_time,
    ts.cost,
    NULL,
    '{}'::jsonb,
    (ROW_NUMBER() OVER (PARTITION BY ts.trip_id, ts.day_number ORDER BY ts.start_time NULLS LAST, ts.id) - 1)::integer
FROM public.trip_stops ts
JOIN public.trip_days td ON ts.trip_id = td.trip_id AND ts.day_number = td.day_number;

-- 7.3 Backfill trip_members with trip owners
INSERT INTO public.trip_members (trip_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.trips;

-- 7.4 Row Count Verification & Cleanup
DO $$
DECLARE
    old_count integer;
    new_count integer;
BEGIN
    SELECT COUNT(*) INTO old_count FROM public.trip_stops;
    SELECT COUNT(*) INTO new_count FROM public.trip_items;
    
    IF old_count <> new_count THEN
        RAISE EXCEPTION 'Data migration failed: trip_stops count (%) does not match migrated trip_items count (%).', old_count, new_count;
    END IF;
END $$;

DROP TABLE public.trip_stops;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON public.trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON public.trip_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_items_trip_day_id ON public.trip_items(trip_day_id);

-- 9. Triggers for owner invariant

-- 9.1 Auto-add owner to members
CREATE OR REPLACE FUNCTION public.handle_new_trip_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.trip_members (trip_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_trip_created
    AFTER INSERT ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_trip_owner();

-- 9.2 Prevent client from updating trips.owner_id
CREATE OR REPLACE FUNCTION public.prevent_owner_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    IF NEW.owner_id <> OLD.owner_id THEN
        RAISE EXCEPTION 'Ownership transfer is not allowed.';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_owner_transfer
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_owner_update();

-- 9.3 Ensure owner_id is authenticated user on insert
CREATE OR REPLACE FUNCTION public.ensure_trip_owner_is_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
        RETURN NEW;
    END IF;
    
    IF auth.uid() IS NOT NULL AND NEW.owner_id <> auth.uid() THEN
        RAISE EXCEPTION 'owner_id must be the authenticated user.';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_trip_owner_insert
    BEFORE INSERT ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_trip_owner_is_auth_user();

-- 9.4 Prevent deleting/demoting the owner in trip_members
CREATE OR REPLACE FUNCTION public.protect_trip_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    trip_owner uuid;
BEGIN
    SELECT owner_id INTO trip_owner FROM public.trips WHERE id = OLD.trip_id;
    
    IF OLD.user_id = trip_owner THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Cannot remove the owner from trip_members.';
        ELSIF TG_OP = 'UPDATE' AND NEW.role <> 'owner' THEN
            RAISE EXCEPTION 'Cannot change the role of the trip owner.';
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_trip_owner
    BEFORE UPDATE OR DELETE ON public.trip_members
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_trip_owner_membership();

-- 10. Grants
GRANT ALL ON TABLE public.trip_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.trip_days TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.trip_items TO anon, authenticated, service_role;

-- 11. RLS SECURITY MODEL

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_trip_public(trip_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.trips
        WHERE id = trip_uuid AND is_public = true
    );
$$;

CREATE OR REPLACE FUNCTION public.get_trip_member_role(trip_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT role
    FROM public.trip_members
    WHERE trip_id = trip_uuid AND user_id = auth.uid();
$$;


-- RLS for public.trips (REPLACING old policies)
DROP POLICY IF EXISTS "trips_public_read" ON public.trips;
DROP POLICY IF EXISTS "trips_owner_read" ON public.trips;
DROP POLICY IF EXISTS "trips_owner_insert" ON public.trips;
DROP POLICY IF EXISTS "trips_owner_update" ON public.trips;
DROP POLICY IF EXISTS "trips_owner_delete" ON public.trips;

-- Read: public trips OR owner OR user is a member
CREATE POLICY "trips_select_policy"
ON public.trips
FOR SELECT
TO anon, authenticated
USING (
    is_public = true OR
    owner_id = auth.uid() OR
    public.get_trip_member_role(id) IS NOT NULL
);

-- Insert: Authenticated user can create trip
CREATE POLICY "trips_insert_policy"
ON public.trips
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update: Owner or Editor can update trip details. (owner_id change is prevented by trigger)
CREATE POLICY "trips_update_policy"
ON public.trips
FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid() OR
    public.get_trip_member_role(id) IN ('owner', 'editor')
)
WITH CHECK (
    owner_id = auth.uid() OR
    public.get_trip_member_role(id) IN ('owner', 'editor')
);

-- Delete: Only Owner can delete trip
CREATE POLICY "trips_delete_policy"
ON public.trips
FOR DELETE
TO authenticated
USING (
    owner_id = auth.uid() OR
    public.get_trip_member_role(id) = 'owner'
);


-- RLS for public.trip_members
-- Read: Only Members of the trip
CREATE POLICY "trip_members_select_policy"
ON public.trip_members
FOR SELECT
TO authenticated
USING (
    public.get_trip_member_role(trip_id) IS NOT NULL
);

-- Insert/Update/Delete: Only Owner can manage members
CREATE POLICY "trip_members_insert_policy"
ON public.trip_members
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_trip_member_role(trip_id) = 'owner'
);

CREATE POLICY "trip_members_update_policy"
ON public.trip_members
FOR UPDATE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) = 'owner'
)
WITH CHECK (
    public.get_trip_member_role(trip_id) = 'owner'
);

CREATE POLICY "trip_members_delete_policy"
ON public.trip_members
FOR DELETE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) = 'owner'
);


-- RLS for public.trip_days
-- Read: Public trip or is member
CREATE POLICY "trip_days_select_policy"
ON public.trip_days
FOR SELECT
TO anon, authenticated
USING (
    public.is_trip_public(trip_id) OR
    public.get_trip_member_role(trip_id) IS NOT NULL
);

-- Insert/Update/Delete: Owner or Editor
CREATE POLICY "trip_days_insert_policy"
ON public.trip_days
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);

CREATE POLICY "trip_days_update_policy"
ON public.trip_days
FOR UPDATE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
)
WITH CHECK (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);

CREATE POLICY "trip_days_delete_policy"
ON public.trip_days
FOR DELETE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);


-- RLS for public.trip_items
-- Read: Public trip or is member
CREATE POLICY "trip_items_select_policy"
ON public.trip_items
FOR SELECT
TO anon, authenticated
USING (
    public.is_trip_public(trip_id) OR
    public.get_trip_member_role(trip_id) IS NOT NULL
);

-- Insert/Update/Delete: Owner or Editor
CREATE POLICY "trip_items_insert_policy"
ON public.trip_items
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);

CREATE POLICY "trip_items_update_policy"
ON public.trip_items
FOR UPDATE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
)
WITH CHECK (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);

CREATE POLICY "trip_items_delete_policy"
ON public.trip_items
FOR DELETE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) IN ('owner', 'editor')
);
