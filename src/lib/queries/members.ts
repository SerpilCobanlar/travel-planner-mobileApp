/**
 * Trip membership queries and mutations (#16, used by #17's member list).
 * Data access lives in src/lib/tripMembers.ts; this file adds caching.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addTripMember,
  AssignableTripRole,
  leaveTrip,
  listTripMembers,
  removeTripMember,
  TripMemberError,
  TripMemberErrorCode,
  updateTripMemberRole,
} from '@/lib/tripMembers';
import { tripKeys } from '@/lib/queries/trips';
import type { TranslationKey } from '@/localization';

export const memberKeys = {
  list: (tripId: string) => [...tripKeys.detail(tripId), 'members'] as const,
};

const ERROR_KEYS: Record<TripMemberErrorCode, TranslationKey> = {
  USER_NOT_FOUND: 'members.errors.userNotFound',
  ALREADY_MEMBER: 'members.errors.alreadyMember',
  CANNOT_ADD_SELF: 'members.errors.cannotAddSelf',
  NO_PERMISSION: 'common.noPermission',
  OWNER_CANNOT_LEAVE: 'members.errors.ownerCannotLeave',
  UNKNOWN: 'auth.error',
};

/** Translation key for any error thrown by a membership mutation. */
export function memberErrorKey(error: unknown): TranslationKey {
  return error instanceof TripMemberError ? ERROR_KEYS[error.code] : 'auth.error';
}

export function useTripMembers(tripId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.list(tripId ?? ''),
    queryFn: () => listTripMembers(tripId!),
    enabled: !!tripId,
  });
}

/** Owner only: invite by exact username. */
export function useAddTripMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, role }: { username: string; role: AssignableTripRole }) =>
      addTripMember(tripId, username, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(tripId) }),
  });
}

/** Owner only. */
export function useUpdateTripMemberRole(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AssignableTripRole }) =>
      updateTripMemberRole(tripId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(tripId) }),
  });
}

/** Owner only: remove another member. */
export function useRemoveTripMember(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeTripMember(tripId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: memberKeys.list(tripId) }),
  });
}

/** Non-owner members: leave the trip. A private trip then disappears for them. */
export function useLeaveTrip(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveTrip(tripId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: tripKeys.detail(tripId) });
      return queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
    },
  });
}
