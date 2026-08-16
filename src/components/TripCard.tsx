import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TripCardProps {
  trip: {
    title?: string;
    description?: string;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{trip.title || 'İsimsiz Gezi'}</Text>
      {trip.description ? (
        <Text style={styles.description}>{trip.description}</Text>
      ) : null}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => console.log('Haritada Gör tıklandı')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Haritada Gör</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
