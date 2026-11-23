-- Migration: Trip member invite rules
-- Description:
--   1. Members (non-owners) can leave a trip by deleting their own membership.
--      The owner still cannot be removed (protect_trip_owner trigger).
--   2. Owners can only grant 'editor' or 'viewer'. Previously an owner could
--      insert/update another member with role 'owner', which also grants the
--      right to delete the trip (trips_delete_policy checks the member role).
--      The real owner row is created by handle_new_trip_owner (SECURITY DEFINER),
--      which is not affected by these policies.

-- Insert: only the trip owner, and only editor/viewer roles
DROP POLICY IF EXISTS "trip_members_insert_policy" ON public.trip_members;
CREATE POLICY "trip_members_insert_policy"
ON public.trip_members
FOR INSERT
TO authenticated
WITH CHECK (
    public.get_trip_member_role(trip_id) = 'owner'
    AND role IN ('editor', 'viewer')
);

-- Update: only the trip owner, and the new role must be editor/viewer
DROP POLICY IF EXISTS "trip_members_update_policy" ON public.trip_members;
CREATE POLICY "trip_members_update_policy"
ON public.trip_members
FOR UPDATE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) = 'owner'
)
WITH CHECK (
    public.get_trip_member_role(trip_id) = 'owner'
    AND role IN ('editor', 'viewer')
);

-- Delete: the trip owner can remove members; any member can remove themselves
DROP POLICY IF EXISTS "trip_members_delete_policy" ON public.trip_members;
CREATE POLICY "trip_members_delete_policy"
ON public.trip_members
FOR DELETE
TO authenticated
USING (
    public.get_trip_member_role(trip_id) = 'owner'
    OR user_id = (SELECT auth.uid())
);
