import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'tr' | 'en';

interface PreferencesContextType {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
  language: LanguagePreference;
  setLanguage: (lang: LanguagePreference) => Promise<void>;
  activeTheme: 'light' | 'dark'; // The actual resolved theme
  isReady: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<LanguagePreference>('tr');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeState(storedTheme as ThemePreference);
        }

        const storedLang = await AsyncStorage.getItem('app_language');
        if (storedLang === 'tr' || storedLang === 'en') {
          setLanguageState(storedLang as LanguagePreference);
        }
      } catch (error) {
        console.error('Failed to load preferences', error);
      } finally {
        setIsReady(true);
      }
    };

    loadPreferences();
  }, []);

  const setTheme = async (newTheme: ThemePreference) => {
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const setLanguage = async (newLang: LanguagePreference) => {
    try {
      await AsyncStorage.setItem('app_language', newLang);
      setLanguageState(newLang);
    } catch (error) {
      console.error('Failed to save language', error);
    }
  };

  const activeTheme: 'light' | 'dark' = theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme;

  return (
    <PreferencesContext.Provider value={{ theme, setTheme, language, setLanguage, activeTheme, isReady }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
