'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import en, { Translations } from './translations/en';
import vi from './translations/vi';

const translations: Record<'en' | 'vi', Translations> = { en, vi };

interface I18nContextValue {
  locale: 'en' | 'vi';
  t: Translations;
  changeLocale: (locale: 'en' | 'vi') => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'vi',
  t: vi,
  changeLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale] = useState<'en' | 'vi'>('vi');
  const changeLocale = useCallback((_l: 'en' | 'vi') => {}, []);

  // Always Vietnamese
  const value: I18nContextValue = {
    locale,
    t: translations['vi'],
    changeLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
