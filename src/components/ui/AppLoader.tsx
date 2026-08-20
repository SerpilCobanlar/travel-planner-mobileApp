import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';
import { useTranslation } from '@/localization';

export function AppLoader() {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.1]
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1]
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View 
        style={[
          styles.circle, 
          { 
            backgroundColor: theme.primary,
            transform: [{ scale }],
            opacity
          }
        ]} 
      />
      <ThemedText style={styles.text} type="smallBold">{t('common.loading')}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
  },
  text: {
    marginTop: 16,
  }
});
