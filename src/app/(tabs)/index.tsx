import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import TripCard from '@/components/TripCard';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import type { Database } from '@/types/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];

export default function HomeScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my_trips' | 'public_trips'>('my_trips');

  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('trips').select('*');

      if (activeTab === 'my_trips') {
        if (!user) {
          setTrips([]);
          return;
        }
        query = query.eq('owner_id', user.id);
      } else {
        query = query.eq('is_public', true);
        if (user) {
          query = query.neq('owner_id', user.id);
        }
      }

      // ordering by start date
      query = query.order('start_date', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setTrips(data || []);
    } catch (err: any) {
      console.error('TRIPS_FETCH_ERROR', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  const renderTrip = ({ item }: { item: Trip }) => (
    <TripCard trip={item} />
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    const emptyText = activeTab === 'my_trips' ? t('common.emptyMyTrips') : t('common.emptyTrips');
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText} themeColor="textSecondary">
          {emptyText}
        </ThemedText>
      </View>
    );
  };

  return (
    <Screen safeArea padded={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle} type="title">
            Travel Planner
          </ThemedText>
          {user && (
            <Button
              title={`+ ${t('trip.newTrip')}`}
              onPress={() => router.push('/trips/new')}
              style={styles.newTripButton}
            />
          )}
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_trips' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('my_trips')}
          >
            <ThemedText
              style={[styles.tabText, activeTab === 'my_trips' && { color: theme.primary, fontWeight: 'bold' }]}
            >
              {t('common.myTrips')}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public_trips' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('public_trips')}
          >
            <ThemedText
              style={[styles.tabText, activeTab === 'public_trips' && { color: theme.primary, fontWeight: 'bold' }]}
            >
              {t('common.publicTrips')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
            <ThemedText style={styles.errorText} themeColor="error">
              {t('auth.error')}: {error}
            </ThemedText>
          </View>
        )}

        {loading && trips.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={renderTrip}
            contentContainerStyle={
              trips.length === 0 ? styles.emptyListContent : styles.listContent
            }
            ListEmptyComponent={renderEmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
  },
  newTripButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
});
