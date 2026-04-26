import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { translations, type Language } from "@/i18n/translations";

const LANG_STORAGE_KEY = "diyoun.lang";
const CURRENCY_STORAGE_KEY = "diyoun.currency";

interface SettingsState {
  language: Language;
  currency: string;
  ready: boolean;
  setLanguage: (lang: Language) => void;
  setCurrency: (code: string) => void;
  t: (key: keyof typeof translations.en) => string;
  isRTL: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [currency, setCurrencyState] = useState<string>("USD");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedLang, storedCurrency] = await Promise.all([
          AsyncStorage.getItem(LANG_STORAGE_KEY),
          AsyncStorage.getItem(CURRENCY_STORAGE_KEY),
        ]);
        if (!mounted) return;
        if (storedLang === "ar" || storedLang === "en") {
          setLanguageState(storedLang);
        }
        if (storedCurrency) {
          setCurrencyState(storedCurrency);
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_STORAGE_KEY, lang).catch(() => {});
  }, []);

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase();
    setCurrencyState(upper);
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, upper).catch(() => {});
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.en) => translations[language][key] ?? key,
    [language],
  );

  const value = useMemo<SettingsState>(
    () => ({
      language,
      currency,
      ready,
      setLanguage,
      setCurrency,
      t,
      isRTL: language === "ar",
    }),
    [language, currency, ready, setLanguage, setCurrency, t],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
