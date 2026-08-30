import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database.types';
import TripDayCard from '@/components/TripDayCard';

type Trip = Database['public']['Tables']['trips']['Row'];
type TripDay = Database['public']['Tables']['trip_days']['Row'];

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTripDetails = useCallback(async () => {
    if (!id) return;
    
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
      if (!tripData) {
        setError(t('trip.notFound'));
        return;
      }

      setTrip(tripData);

      // Fetch Days
      const { data: daysData, error: daysError } = await supabase
        .from('trip_days')
        .select('*')
        .eq('trip_id', id)
        .order('day_number', { ascending: true });

      if (daysError) throw daysError;

      setDays(daysData || []);
    } catch (err: any) {
      console.error('TRIP_DETAIL_FETCH_ERROR', err);
      setError(t('trip.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      fetchTripDetails();
    }, [fetchTripDetails])
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    return `${d}.${m}.${y}`;
  };

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
          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
        </ThemedText>

        <ThemedText style={styles.dailyPlanTitle} type="subtitle">
          {t('trip.dailyPlan')}
        </ThemedText>
      </View>
    );
  };

  if (loading && !trip) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.details'), headerBackTitle: 'Geri' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !trip) {
    return (
      <Screen safeArea>
        <Stack.Screen options={{ title: t('trip.details'), headerBackTitle: 'Geri' }} />
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
      <Stack.Screen options={{ title: trip.title || t('trip.details'), headerBackTitle: 'Geri' }} />
      <FlatList
        data={days}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripDayCard day={item} />}
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
  }
});
