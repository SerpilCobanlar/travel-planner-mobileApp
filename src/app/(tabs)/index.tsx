import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabaseClient';
import TripCard from '@/components/TripCard';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('is_public', true);

        if (error) {
          throw error;
        }

        setTrips(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const renderTrip = ({ item }: { item: any }) => (
    <TripCard trip={item} />
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText} themeColor="textSecondary">
          {t('common.emptyTrips')}
        </ThemedText>
      </View>
    );
  };

  return (
    <Screen safeArea padded={false}>
      <View style={styles.container}>
        <ThemedText style={styles.headerTitle} type="title">
          {t('common.publicTrips')}
        </ThemedText>
        
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
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderTrip}
            contentContainerStyle={
              trips.length === 0 ? styles.emptyListContent : styles.listContent
            }
            ListEmptyComponent={renderEmptyComponent}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
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

