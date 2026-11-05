'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '@/types/models';
import { getTranslation } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (keyPath: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'te', // Default to Telugu for Andhra Pradesh farmers
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k) => k,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with Telugu as primary target language for Andhra Pradesh
  const [language, setLanguageState] = useState<LanguageCode>('te');

  useEffect(() => {
    const saved = localStorage.getItem('crop_radar_lang');
    if (saved === 'te' || saved === 'en') {
      setLanguageState(saved);
    } else {
      setLanguageState('te'); // Primary target is Andhra Pradesh farmers
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('crop_radar_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'te' : 'en';
    setLanguage(next);
  };

  const t = (keyPath: string): string => {
    return getTranslation(keyPath, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
