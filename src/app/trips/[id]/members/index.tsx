import React from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useMyTripRole } from '@/lib/queries/trips';
import {
  memberErrorKey,
  useRemoveTripMember,
  useTripMembers,
  useUpdateTripMemberRole,
} from '@/lib/queries/members';
import type { TripMember, TripRole } from '@/lib/tripMembers';

/** Trip members and their roles (#17). Owner can change roles and remove members; others read only. */
export default function TripMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const membersQuery = useTripMembers(id);
  const roleQuery = useMyTripRole(id, user?.id);
  const updateRole = useUpdateTripMemberRole(id);
  const removeMember = useRemoveTripMember(id);
  useRefreshOnFocus(membersQuery.refetch);

  const isOwner = roleQuery.data === 'owner';
  const members = membersQuery.data ?? [];

  const roleLabel = (role: TripRole) =>
    role === 'owner' ? t('members.roleOwner') : role === 'editor' ? t('members.roleEditor') : t('members.roleViewer');

  const showError = (err: unknown) => Alert.alert(t('auth.error'), t(memberErrorKey(err)));

  // Owner taps the role chip: editor <-> viewer (immediate, easy to switch back).
  const toggleRole = (member: TripMember) => {
    const nextRole = member.role === 'editor' ? 'viewer' : 'editor';
    updateRole.mutate({ userId: member.userId, role: nextRole }, { onError: showError });
  };

  const confirmRemove = (member: TripMember) => {
    Alert.alert(
      t('members.removeConfirmTitle'),
      t('members.removeConfirmMessage').replace('{username}', member.username),
      [
        { text: t('trip.cancel'), style: 'cancel' },
        {
          text: t('members.remove'),
          style: 'destructive',
          onPress: () => removeMember.mutate(member.userId, { onError: showError }),
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: TripMember }) => {
    const isMe = item.userId === user?.id;
    const canManage = isOwner && item.role !== 'owner';
    const busy =
      (updateRole.isPending && updateRole.variables?.userId === item.userId) ||
      (removeMember.isPending && removeMember.variables === item.userId);

    return (
      <Card style={styles.row}>
        <View style={styles.rowMain}>
          <ThemedText type="smallBold" numberOfLines={1}>
            @{item.username}
            {isMe ? <ThemedText themeColor="textSecondary" type="small">{` (${t('members.you')})`}</ThemedText> : null}
          </ThemedText>

          <TouchableOpacity
            disabled={!canManage || busy}
            onPress={() => toggleRole(item)}
            accessibilityHint={canManage ? t('members.changeRoleHint') : undefined}
            style={[
              styles.roleChip,
              { backgroundColor: item.role === 'owner' ? theme.primary + '20' : theme.backgroundSelected },
            ]}
          >
            <ThemedText type="small" style={{ color: item.role === 'owner' ? theme.primary : theme.text }}>
              {roleLabel(item.role)}
              {canManage ? '  ⇄' : ''}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {busy ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : canManage ? (
          <TouchableOpacity onPress={() => confirmRemove(item)} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="error">
              {t('members.remove')}
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: t('members.title') }} />

      {membersQuery.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : membersQuery.isError ? (
        <View style={styles.center}>
          <ThemedText themeColor="error">{t('members.fetchError')}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          renderItem={renderMember}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            isOwner ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                {t('members.changeRoleHint')}
              </ThemedText>
            ) : null
          }
          ListFooterComponent={
            isOwner ? (
              <Button
                title={t('members.inviteButton')}
                onPress={() => router.push(`/trips/${id}/members/invite`)}
                icon="person.fill"
                style={styles.inviteButton}
              />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 16,
  },
  hint: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  rowMain: {
    flex: 1,
    gap: 6,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviteButton: {
    marginTop: 8,
  },
});
