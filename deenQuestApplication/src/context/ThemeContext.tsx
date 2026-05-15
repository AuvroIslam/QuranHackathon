import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DARK_COLORS, LIGHT_COLORS, type AppColors } from '../theme';
import { DEFAULT_TRANSLATION_ID } from '../lib/translations';
import { getUserProfile, updateUserPreferences } from '../lib/firestore';
import { useAuth } from './AuthContext';

const THEME_KEY = '@deenquest/theme';
const TRANSLATION_KEY = '@deenquest/translation';

interface ThemeContextValue {
  isDark: boolean;
  colors: AppColors;
  toggleTheme: () => void;
  translationId: number;
  setTranslationId: (id: number) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  translationId: DEFAULT_TRANSLATION_ID,
  setTranslationId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { uid } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [translationId, setTranslationIdState] = useState(DEFAULT_TRANSLATION_ID);

  // Load local preferences from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, TRANSLATION_KEY]).then((pairs) => {
      const themeVal = pairs[0][1];
      const transVal = pairs[1][1];
      if (themeVal !== null) setIsDark(themeVal === 'dark');
      if (transVal !== null) setTranslationIdState(parseInt(transVal, 10));
    }).catch(() => {});
  }, []);

  // When user signs in, load their Firestore preferences (overrides local)
  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid).then((profile) => {
      if (!profile) return;
      if (profile.preferredTheme) {
        const dark = profile.preferredTheme === 'dark';
        setIsDark(dark);
        AsyncStorage.setItem(THEME_KEY, profile.preferredTheme).catch(() => {});
      }
      if (profile.preferredTranslationId) {
        setTranslationIdState(profile.preferredTranslationId);
        AsyncStorage.setItem(TRANSLATION_KEY, String(profile.preferredTranslationId)).catch(() => {});
      }
    }).catch(() => {});
  }, [uid]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      if (uid) updateUserPreferences(uid, { preferredTheme: next ? 'dark' : 'light' }).catch(() => {});
      return next;
    });
  }, [uid]);

  const setTranslationId = useCallback((id: number) => {
    setTranslationIdState(id);
    AsyncStorage.setItem(TRANSLATION_KEY, String(id)).catch(() => {});
    if (uid) updateUserPreferences(uid, { preferredTranslationId: id }).catch(() => {});
  }, [uid]);

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      toggleTheme,
      translationId,
      setTranslationId,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
