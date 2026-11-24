import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { formatDayDate } from '@/lib/date';
import { useAuth } from '@/context/AuthContext';
import TripItemCard from '@/components/TripItemCard';
import {
  NoRowsAffectedError,
  TripItem,
  useDeleteTripItem,
  useMyTripRole,
  useTrip,
  useTripDays,
  useTripItems,
} from '@/lib/queries/trips';

export default function DayDetailScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  // Same cache as the trip screen: opening a day is instant.
  const tripQuery = useTrip(id);
  const daysQuery = useTripDays(id);
  const itemsQuery = useTripItems(id);
  const roleQuery = useMyTripRole(id, user?.id);
  const deleteItem = useDeleteTripItem(id);

  const trip = tripQuery.data ?? null;
  // Only a day that belongs to this trip (cross-trip safety)
  const day = daysQuery.data?.find((d) => d.id === dayId) ?? null;
  const items = (itemsQuery.data ?? []).filter((i) => i.trip_day_id === dayId);
  const canEdit = roleQuery.data === 'owner' || roleQuery.data === 'editor';
  const loading = tripQuery.isPending || daysQuery.isPending || itemsQuery.isPending;
  const error = tripQuery.error || daysQuery.error || itemsQuery.error ? t('item.fetchError') : null;

  useRefreshOnFocus(() => Promise.all([daysQuery.refetch(), itemsQuery.refetch()]));

  const handleDeleteItem = (item: TripItem) => {
    // Optimistic: the plan disappears right away and comes back if the delete fails.
    deleteItem.mutate(item.id, {
      onError: (err) => {
        if (err instanceof NoRowsAffectedError) {
          Alert.alert(t('auth.error'), t('common.noPermission'));
        } else {
          console.error('DELETE_TRIP_ITEM_ERROR', err);
          Alert.alert(t('auth.error'), t('item.deleteError'));
        }
      },
    });
  };


  const renderHeader = () => {
    if (!trip || !day) return null;

    const hasLocations = items.some((i) => i.latitude !== null && i.longitude !== null);

    return (
      <View style={styles.headerContainer}>
        <ThemedText style={styles.tripTitle} type="default" themeColor="textSecondary">
          {trip.title}
        </ThemedText>
        
        <View style={styles.dayTitleRow}>
          <ThemedText style={styles.dayNumber} type="title">
            {t('trip.day')} {day.day_number}
          </ThemedText>
          <ThemedText style={styles.dayDate} type="subtitle" themeColor="textSecondary">
            {formatDayDate(day.day_date)}
          </ThemedText>
        </View>

        {day.title && (
          <ThemedText style={styles.dayTitle} type="subtitle">
            {day.title}
          </ThemedText>
        )}

        {day.notes && (
          <ThemedText style={styles.notes} type="default" themeColor="textSecondary">
            {day.notes}
          </ThemedText>
        )}

        {hasLocations && (
          <Button
            title={t('trip.viewOnMap')}
            onPress={() => router.push(`/trips/${id}/days/${dayId}/map`)}
            style={styles.mapButton}
            variant="outline"
          />
        )}

        <View style={[styles.plansHeader, { borderBottomColor: theme.border }]}>
          <ThemedText type="subtitle">{t('item.plans')}</ThemedText>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText} themeColor="textSecondary">
          {t('item.emptyDay')}
        </ThemedText>
        {canEdit && (
          <Button
            title={t('item.addPlan')}
            onPress={() => router.push(`/trips/${id}/days/${dayId}/new-item`)}
            style={styles.emptyAddButton}
          />
        )}
      </View>
    );
  };

  if (loading && !day) {
    return (
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('item.dayDetail') }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !day) {
    return (
      <Screen safeArea="bottom">
        <Stack.Screen options={{ title: t('item.dayDetail') }} />
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
      <Stack.Screen options={{ title: `${t('trip.day')} ${day.day_number}` }} />
      <View style={styles.container}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripItemCard
              item={item}
              canEdit={canEdit}
              onEdit={(i) => router.push(`/trips/${id}/days/${dayId}/items/${i.id}/edit`)}
              onDelete={handleDeleteItem}
              onShowMap={(i) => router.push(`/trips/${id}/days/${dayId}/map?focusItemId=${i.id}`)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        
        {canEdit && items.length > 0 && (
          <View style={[styles.fabContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <Button
              title={t('item.addPlan')}
              onPress={() => router.push(`/trips/${id}/days/${dayId}/new-item`)}
            />
          </View>
        )}
      </View>
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
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // space for FAB
  },
  headerContainer: {
    marginBottom: 20,
  },
  mapButton: {
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 14,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  dayNumber: {
    fontSize: 28,
    marginRight: 12,
  },
  dayDate: {
    fontSize: 18,
  },
  dayTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  notes: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  plansHeader: {
    marginTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyAddButton: {
    minWidth: 150,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  }
});
