'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_TRANSLATION_ID } from '@/lib/translations';
import { updateUserPreferences } from '@/lib/firestore';

interface ThemeContextValue {
  translationId: number;
  setTranslationId: (id: number) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  translationId: DEFAULT_TRANSLATION_ID,
  setTranslationId: () => {},
});

export function ThemeProvider({ children, uid }: { children: React.ReactNode; uid?: string | null }) {
  const [translationId, setTranslationIdState] = useState(DEFAULT_TRANSLATION_ID);

  useEffect(() => {
    const saved = localStorage.getItem('deenquest-translation');
    if (saved !== null) setTranslationIdState(parseInt(saved, 10));
  }, []);

  const setTranslationId = useCallback((id: number) => {
    setTranslationIdState(id);
    localStorage.setItem('deenquest-translation', String(id));
    if (uid) updateUserPreferences(uid, { preferredTranslationId: id }).catch(() => {});
  }, [uid]);

  return (
    <ThemeContext.Provider value={{ translationId, setTranslationId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
