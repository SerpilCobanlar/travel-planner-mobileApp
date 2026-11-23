import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { useTranslation, TranslationKey } from '@/localization';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';

// Placeholder until the real Blog (travel journals, #32) arrives in Aşama 4 (#19).
type Feature = {
  icon: SymbolViewProps['name'];
  title: TranslationKey;
  text: TranslationKey;
};

const FEATURES: Feature[] = [
  {
    icon: { ios: 'book.pages', android: 'menu_book', web: 'menu_book' },
    title: 'blog.featureJournalTitle',
    text: 'blog.featureJournalText',
  },
  {
    icon: { ios: 'envelope.open', android: 'mail', web: 'mail' },
    title: 'blog.featurePostcardsTitle',
    text: 'blog.featurePostcardsText',
  },
  {
    icon: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
    title: 'blog.featureShareTitle',
    text: 'blog.featureShareText',
  },
];

export default function BlogScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Screen scrollable safeArea>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: theme.primary + '1A' }]}>
          <SymbolView
            name={{ ios: 'book.closed.fill', android: 'auto_stories', web: 'auto_stories' }}
            size={40}
            tintColor={theme.primary}
          />
        </View>

        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={styles.badgeText}>
            {t('blog.comingSoon')}
          </ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          {t('blog.title')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          {t('blog.description')}
        </ThemedText>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View
            key={feature.title}
            style={[styles.featureRow, { backgroundColor: theme.backgroundElement }]}
          >
            <SymbolView name={feature.icon} size={24} tintColor={theme.primary} />
            <View style={styles.featureTextBlock}>
              <ThemedText type="smallBold">{t(feature.title)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.featureText}>
                {t(feature.text)}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFFFFF',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: BorderRadius.lg,
  },
  featureTextBlock: {
    flex: 1,
  },
  featureText: {
    marginTop: 2,
    lineHeight: 20,
  },
});
