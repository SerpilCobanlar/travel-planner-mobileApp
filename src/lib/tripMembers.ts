/**
 * Trip membership data access (#16).
 *
 * Plain async functions so screens (and later TanStack Query hooks, #33) can
 * share them. Permissions are enforced by RLS; these functions translate the
 * database results into typed values and `TripMemberError`s for the UI.
 *
 * Rules (see supabase/migrations/*_trip_members_invite_rules.sql):
 * - Only the trip owner can add, remove or change the role of members.
 * - Owners can grant only 'editor' or 'viewer'.
 * - Any non-owner member can leave a trip. The owner cannot leave or be removed.
 */
import { supabase } from '@/lib/supabaseClient';

export type TripRole = 'owner' | 'editor' | 'viewer';
/** Roles an owner can grant to other members. */
export type AssignableTripRole = 'editor' | 'viewer';

export interface TripMember {
  userId: string;
  role: TripRole;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface ProfileSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export type TripMemberErrorCode =
  | 'USER_NOT_FOUND'
  | 'ALREADY_MEMBER'
  | 'CANNOT_ADD_SELF'
  | 'NO_PERMISSION'
  | 'OWNER_CANNOT_LEAVE'
  | 'UNKNOWN';

/** Error with a stable `code` the UI can map to a translated message. */
export class TripMemberError extends Error {
  readonly code: TripMemberErrorCode;

  constructor(code: TripMemberErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'TripMemberError';
    this.code = code;
  }
}

const ROLES: readonly TripRole[] = ['owner', 'editor', 'viewer'];

function toTripRole(role: string): TripRole {
  return (ROLES as readonly string[]).includes(role) ? (role as TripRole) : 'viewer';
}

/** Maps a PostgREST/Postgres error to a TripMemberError. */
function toMemberError(error: { code?: string; message?: string }): TripMemberError {
  if (error.code === '23505') return new TripMemberError('ALREADY_MEMBER', error.message);
  // 42501 = RLS violation on insert/update
  if (error.code === '42501') return new TripMemberError('NO_PERMISSION', error.message);
  if (error.message?.includes('Cannot remove the owner')) {
    return new TripMemberError('OWNER_CANNOT_LEAVE', error.message);
  }
  return new TripMemberError('UNKNOWN', error.message);
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new TripMemberError('NO_PERMISSION', 'Not signed in');
  return data.user.id;
}

/** Usernames are stored lowercase (see handle_new_user). */
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Members of a trip, owner first, then by join date. Only members can read this list. */
export async function listTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('user_id, role, created_at, profiles(username, avatar_url)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (error) throw toMemberError(error);

  const members = (data ?? []).map((row) => ({
    userId: row.user_id,
    role: toTripRole(row.role),
    username: row.profiles?.username ?? '',
    avatarUrl: row.profiles?.avatar_url ?? null,
    joinedAt: row.created_at,
  }));

  return members.sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'));
}

/** The signed-in user's role in a trip, or null if they are not a member. */
export async function getMyTripRole(tripId: string): Promise<TripRole | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw toMemberError(error);
  return data ? toTripRole(data.role) : null;
}

/** Exact username lookup (no partial search, to avoid listing all users). */
export async function findProfileByUsername(username: string): Promise<ProfileSummary | null> {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', normalized)
    .maybeSingle();

  if (error) throw toMemberError(error);
  return data ? { id: data.id, username: data.username, avatarUrl: data.avatar_url } : null;
}

/** Owner only. Adds a user to the trip by username. */
export async function addTripMember(
  tripId: string,
  username: string,
  role: AssignableTripRole
): Promise<TripMember> {
  const [userId, profile] = await Promise.all([requireUserId(), findProfileByUsername(username)]);

  if (!profile) throw new TripMemberError('USER_NOT_FOUND');
  if (profile.id === userId) throw new TripMemberError('CANNOT_ADD_SELF');

  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: profile.id, role })
    .select('created_at')
    .single();

  if (error) throw toMemberError(error);

  return {
    userId: profile.id,
    role,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    joinedAt: data.created_at,
  };
}

/** Owner only. Changes a member's role to editor or viewer. */
export async function updateTripMemberRole(
  tripId: string,
  memberUserId: string,
  role: AssignableTripRole
): Promise<void> {
  const { data, error } = await supabase
    .from('trip_members')
    .update({ role })
    .eq('trip_id', tripId)
    .eq('user_id', memberUserId)
    .select('user_id');

  if (error) throw toMemberError(error);
  // RLS-blocked updates affect 0 rows without an error.
  if (!data || data.length === 0) throw new TripMemberError('NO_PERMISSION');
}

/** Owner only. Removes another member from the trip. */
export async function removeTripMember(tripId: string, memberUserId: string): Promise<void> {
  const { data, error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', memberUserId)
    .select('user_id');

  if (error) throw toMemberError(error);
  if (!data || data.length === 0) throw new TripMemberError('NO_PERMISSION');
}

/** Any non-owner member. Removes the signed-in user from the trip. */
export async function leaveTrip(tripId: string): Promise<void> {
  const userId = await requireUserId();
  await removeTripMember(tripId, userId);
}
