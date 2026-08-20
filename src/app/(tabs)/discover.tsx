import React from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox, { initializeMapbox } from '@/lib/mapbox';

// Initialize Mapbox with token from env variables
initializeMapbox();

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          zoomLevel={10}
          centerCoordinate={[28.9784, 41.0082]} // Istanbul
        />
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
