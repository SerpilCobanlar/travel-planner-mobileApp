-- ============================================================
-- DAY 1 SECURITY FOUNDATION
-- Enable Row Level Security for core application tables
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================

alter table public.profiles
enable row level security;


-- Profiles are public information.
-- Needed later for public trips, blog authors and user profiles.
create policy "profiles_public_read"
on public.profiles
for select
to anon, authenticated
using (true);


-- A signed-in user can only create their own profile.
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  (select auth.uid()) = id
);


-- A signed-in user can only update their own profile.
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);



-- ============================================================
-- TRIPS
-- ============================================================

alter table public.trips
enable row level security;


-- Anyone can view trips explicitly marked as public.
create policy "trips_public_read"
on public.trips
for select
to anon, authenticated
using (
  is_public = true
);


-- Signed-in users can also view their own private/public trips.
create policy "trips_owner_read"
on public.trips
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


-- A user can only create a trip belonging to themselves.
create policy "trips_owner_insert"
on public.trips
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);


-- Only the owner can update a trip.
create policy "trips_owner_update"
on public.trips
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


-- Only the owner can delete a trip.
create policy "trips_owner_delete"
on public.trips
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);



-- ============================================================
-- TRIP STOPS
-- ============================================================

alter table public.trip_stops
enable row level security;


-- Anyone can read stops belonging to a public trip.
create policy "trip_stops_public_read"
on public.trip_stops
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.is_public = true
  )
);


-- A trip owner can read stops belonging to their own trip,
-- including private trips.
create policy "trip_stops_owner_read"
on public.trip_stops
for select
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = (select auth.uid())
  )
);


-- Only the trip owner can add stops.
create policy "trip_stops_owner_insert"
on public.trip_stops
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = (select auth.uid())
  )
);


-- Only the trip owner can update stops.
create policy "trip_stops_owner_update"
on public.trip_stops
for update
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = (select auth.uid())
  )
);


-- Only the trip owner can delete stops.
create policy "trip_stops_owner_delete"
on public.trip_stops
for delete
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_stops.trip_id
      and trips.user_id = (select auth.uid())
  )
);