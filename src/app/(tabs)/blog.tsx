import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/localization';

export default function BlogScreen() {
  const { t } = useTranslation();

  return (
    <Screen safeArea>
      <View style={styles.container}>
        <ThemedText style={styles.headerTitle} type="title">
          {t('tabs.blog')}
        </ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          {t('common.blogDescription')}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
  }
});

