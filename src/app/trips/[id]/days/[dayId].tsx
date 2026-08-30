import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import TripItemCard from '@/components/TripItemCard';
import type { Database } from '@/types/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripDay = Database['public']['Tables']['trip_days']['Row'];
type TripItem = Database['public']['Tables']['trip_items']['Row'];

export default function DayDetailScreen() {
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [day, setDay] = useState<TripDay | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id || !dayId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch Trip
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // Fetch Day
      const { data: dayData, error: dayError } = await supabase
        .from('trip_days')
        .select('*')
        .eq('id', dayId)
        .eq('trip_id', id) // Cross-trip safety
        .single();

      if (dayError) throw dayError;
      setDay(dayData);

      // Fetch Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('trip_items')
        .select('*')
        .eq('trip_id', id)
        .eq('trip_day_id', dayId)
        .order('start_at', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Check Permission
      if (user) {
        if (tripData.owner_id === user.id) {
          setCanEdit(true);
        } else {
          try {
            const { data: memberData } = await supabase
              .from('trip_members')
              .select('role')
              .eq('trip_id', id)
              .eq('user_id', user.id)
              .single();
            
            if (memberData && (memberData.role === 'owner' || memberData.role === 'editor')) {
              setCanEdit(true);
            } else {
              setCanEdit(false);
            }
          } catch (err) {
            console.error('TRIP_MEMBER_FETCH_ERROR', err);
            setCanEdit(false);
          }
        }
      }

    } catch (err: any) {
      console.error('TRIP_DAY_FETCH_ERROR', err);
      setError(t('item.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [id, dayId, t, user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDeleteItem = async (item: TripItem) => {
    try {
      const { error: deleteError } = await supabase
        .from('trip_items')
        .delete()
        .eq('id', item.id)
        .eq('trip_id', id)
        .eq('trip_day_id', dayId);

      if (deleteError) throw deleteError;

      // Optimistic remove
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error('DELETE_TRIP_ITEM_ERROR', err);
      setError(t('item.deleteError'));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y}`;
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
            {formatDate(day.day_date)}
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
      <Screen safeArea>
        <Stack.Screen options={{ title: t('item.dayDetail'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !day) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('item.dayDetail'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ThemedText style={styles.errorText} themeColor="error">
            {error || t('trip.notFound')}
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea padded={false}>
      <Stack.Screen options={{ title: `${t('trip.day')} ${day.day_number}`, headerBackTitle: 'Geri' }} />
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
