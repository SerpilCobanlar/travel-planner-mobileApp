import React from 'react';
import { StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';

interface TripCardProps {
  trip: {
    title?: string;
    description?: string;
  };
}

export default function TripCard({ trip }: TripCardProps) {

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title} type="subtitle">
        {trip.title || 'İsimsiz Gezi'}
      </ThemedText>
      {trip.description ? (
        <ThemedText style={styles.description} type="default" themeColor="textSecondary">
          {trip.description}
        </ThemedText>
      ) : null}

      <Button
        title="Haritada Gör"
        onPress={() => console.log('Haritada Gör tıklandı')}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
  },
  button: {
    marginTop: 4,
  },
});
