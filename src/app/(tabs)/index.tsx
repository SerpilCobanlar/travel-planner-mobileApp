import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import TripCard from '@/components/TripCard';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { Trip, useTrips } from '@/lib/queries/trips';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'my_trips' | 'public_trips'>('my_trips');

  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const tripsQuery = useTrips(activeTab === 'my_trips' ? 'mine' : 'public', user?.id);
  const trips = tripsQuery.data ?? [];
  const loading = tripsQuery.isPending;
  const error = tripsQuery.error ? tripsQuery.error.message : null;
  useRefreshOnFocus(tripsQuery.refetch);

  const renderTrip = ({ item }: { item: Trip }) => (
    <TripCard trip={item} onPress={() => router.push(`/trips/${item.id}`)} />
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
