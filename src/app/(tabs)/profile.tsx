import React, { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { usePreferences, LanguagePreference } from '@/context/PreferencesContext';
import { useTranslation } from '@/localization';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/hooks/use-theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme, setTheme, language, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const colors = useTheme();
  const systemTheme = useColorScheme() || 'light';
  
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username);
          }
        });
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getSystemThemeText = () => {
    const isDark = systemTheme === 'dark';
    if (language === 'tr') {
      return `Sistem • Şu an ${isDark ? 'Koyu' : 'Açık'}`;
    }
    return `System • Currently ${isDark ? 'Dark' : 'Light'}`;
  };

  return (
    <Screen scrollable safeArea>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle} type="title">
          {t('profile.title')}
        </ThemedText>
      </View>

      <Card style={styles.infoCard}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('auth.email')}
        </ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          {user?.email || '-'}
        </ThemedText>

        <View style={styles.spacer} />

        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('auth.username')}
        </ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          {username || '-'}
        </ThemedText>
      </Card>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {t('profile.settings')}
      </ThemedText>
      
      <Card>
        <View style={styles.settingRow}>
          <View style={styles.rowHeader}>
            <IconSymbol name="gearshape.fill" size={20} color={colors.textSecondary} />
            <ThemedText style={styles.rowTitle}>{t('profile.theme')}</ThemedText>
          </View>
          <View style={styles.buttonGroupVertical}>
            <Button
              title={getSystemThemeText()}
              variant={theme === 'system' ? 'primary' : 'outline'}
              onPress={() => setTheme('system')}
              style={[styles.themeBtn, theme !== 'system' && { borderColor: colors.border }] as any}
            />
            <View style={styles.buttonGroup}>
              <Button
                title={t('profile.themeLight')}
                variant={theme === 'light' ? 'primary' : 'outline'}
                onPress={() => setTheme('light')}
                style={[styles.smallButton, theme !== 'light' && { borderColor: colors.border }] as any}
                textStyle={styles.smallButtonText}
              />
              <Button
                title={t('profile.themeDark')}
                variant={theme === 'dark' ? 'primary' : 'outline'}
                onPress={() => setTheme('dark')}
                style={[styles.smallButton, theme !== 'dark' && { borderColor: colors.border }] as any}
                textStyle={styles.smallButtonText}
              />
            </View>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        <View style={styles.settingRow}>
          <View style={styles.rowHeader}>
            <IconSymbol name="globe" size={20} color={colors.textSecondary} />
            <ThemedText style={styles.rowTitle}>{t('profile.language')}</ThemedText>
          </View>
          <View style={styles.buttonGroup}>
            {(['tr', 'en'] as LanguagePreference[]).map((lOpt) => (
              <Button
                key={lOpt}
                title={lOpt === 'tr' ? 'Türkçe' : 'English'}
                variant={language === lOpt ? 'primary' : 'outline'}
                onPress={() => setLanguage(lOpt)}
                style={[styles.smallButton, language !== lOpt && { borderColor: colors.border }] as any}
                textStyle={styles.smallButtonText}
              />
            ))}
          </View>
        </View>
      </Card>

      <Button 
        title={t('profile.logout')}
        onPress={handleLogout}
        style={styles.logoutButton}
        variant="ghost"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    marginBottom: 10,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoText: {
    marginTop: 4,
    fontSize: 18,
  },
  spacer: {
    height: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
  },
  settingRow: {
    paddingVertical: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowTitle: {
    marginLeft: 8,
  },
  buttonGroupVertical: {
    gap: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    height: 40,
    paddingHorizontal: 12,
  },
  smallButton: {
    height: 40,
    paddingHorizontal: 12,
    flex: 1,
  },
  smallButtonText: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  logoutButton: {
    marginTop: 20,
  }
});
