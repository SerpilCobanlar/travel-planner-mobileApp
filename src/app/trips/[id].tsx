import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useAuth } from '@/context/AuthContext';
import { formatDayRange } from '@/lib/date';
import {
  NoRowsAffectedError,
  useDeleteTrip,
  useMyTripRole,
  useTrip,
  useTripDays,
  useTripItems,
} from '@/lib/queries/trips';
import { memberErrorKey, useLeaveTrip } from '@/lib/queries/members';
import TripDayCard from '@/components/TripDayCard';
import { Button } from '@/components/ui/Button';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const tripQuery = useTrip(id);
  const daysQuery = useTripDays(id);
  const itemsQuery = useTripItems(id);
  const roleQuery = useMyTripRole(id, user?.id);
  const deleteTrip = useDeleteTrip();
  const leaveTrip = useLeaveTrip(id);

  const trip = tripQuery.data ?? null;
  const days = daysQuery.data ?? [];
  const allItems = itemsQuery.data ?? [];
  const role = roleQuery.data ?? null;
  const loading = tripQuery.isPending || daysQuery.isPending;
  const error = tripQuery.error || daysQuery.error || itemsQuery.error ? t('trip.fetchError') : null;
  const isDeleting = deleteTrip.isPending;

  useRefreshOnFocus(() => Promise.all([tripQuery.refetch(), daysQuery.refetch(), itemsQuery.refetch()]));

  const renderHeader = () => {
    if (!trip) return null;
    const isPublicText = trip.is_public ? t('trip.isPublic') : t('trip.isPrivate');
    const badgeColor = trip.is_public ? theme.primary : theme.textSecondary;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} type="title">
            {trip.title}
          </ThemedText>
          <View style={[styles.badge, { borderColor: badgeColor }]}>
            <ThemedText style={[styles.badgeText, { color: badgeColor }]}>{isPublicText}</ThemedText>
          </View>
        </View>

        {trip.description && (
          <ThemedText style={styles.description} type="default" themeColor="textSecondary">
            {trip.description}
          </ThemedText>
        )}

        <ThemedText style={styles.dateRow} type="default" themeColor="textSecondary">
          {formatDayRange(trip.start_date, trip.end_date)}
        </ThemedText>

        <ThemedText style={styles.dailyPlanTitle} type="subtitle">
          {t('trip.dailyPlan')}
        </ThemedText>

        {(role === 'owner' || role === 'editor') && (
          <View style={styles.actionsContainer}>
            <Button
              title={t('trip.editTrip')}
              onPress={() => router.push(`/trips/${id}/edit`)}
              style={styles.actionButton}
              variant="outline"
              icon="pencil"
            />
            {role === 'owner' && (
              <Button
                title={isDeleting ? t('common.loading') : t('trip.deleteTrip')}
                onPress={handleDelete}
                disabled={isDeleting}
                style={[styles.actionButton, styles.deleteButton]}
                textStyle={styles.deleteButtonText}
                variant="outline"
                icon="trash"
              />
            )}
          </View>
        )}

        {role === 'owner' && (
          <Button
            title={t('members.inviteButton')}
            onPress={() => router.push(`/trips/${id}/members/invite`)}
            style={styles.memberButton}
            variant="outline"
            icon="person.fill"
          />
        )}

        {/* Editors and viewers can leave; the owner can't (protect_trip_owner trigger). */}
        {(role === 'editor' || role === 'viewer') && (
          <Button
            title={leaveTrip.isPending ? t('common.loading') : t('members.leave')}
            onPress={handleLeave}
            disabled={leaveTrip.isPending}
            style={[styles.memberButton, styles.deleteButton]}
            textStyle={styles.deleteButtonText}
            variant="outline"
            icon="rectangle.portrait.and.arrow.right"
          />
        )}
      </View>
    );
  };

  const handleLeave = () => {
    Alert.alert(t('members.leaveConfirmTitle'), t('members.leaveConfirmMessage'), [
      { text: t('trip.cancel'), style: 'cancel' },
      {
        text: t('members.leave'),
        style: 'destructive',
        onPress: () =>
          leaveTrip.mutate(undefined, {
            onSuccess: () => {
              router.dismissAll();
              router.replace('/(tabs)');
            },
            onError: (err) => {
              console.error('LEAVE_TRIP_ERROR', err);
              Alert.alert(t('auth.error'), t(memberErrorKey(err)));
            },
          }),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      t('trip.deleteConfirmTitle'),
      t('trip.deleteConfirmMessage'),
      [
        { text: t('trip.cancel'), style: 'cancel' },
        {
          text: t('trip.delete'),
          style: 'destructive',
          onPress: () => {
            if (isDeleting || !id) return;
            deleteTrip.mutate(id, {
              onSuccess: () => {
                router.dismissAll();
                router.replace('/(tabs)');
              },
              onError: (err) => {
                if (err instanceof NoRowsAffectedError) {
                  Alert.alert(t('auth.error'), t('common.noPermission'));
                } else {
                  console.error('DELETE_TRIP_ERROR', err);
                  Alert.alert(t('auth.error'), t('trip.deleteError'));
                }
              },
            });
          }
        }
      ]
    );
  };

  if (loading && !trip) {
    return (
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('trip.details') }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('trip.details') }} />
        <View style={styles.center}>
          <ThemedText style={styles.errorText} themeColor="error">
            {error || t('trip.notFound')}
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea="bottom" padded={false}>
      <Stack.Screen options={{ title: trip.title || t('trip.details') }} />
      <FlatList
        data={days}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripDayCard
            day={item}
            items={allItems.filter((i) => i.trip_day_id === item.id)}
            onPress={() => router.push(`/trips/${id}/days/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    marginRight: 12,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 12,
    lineHeight: 22,
  },
  dateRow: {
    marginBottom: 24,
    fontWeight: '600',
  },
  dailyPlanTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  memberButton: {
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#ff4444',
  },
  deleteButtonText: {
    color: '#ff4444',
  },
});
