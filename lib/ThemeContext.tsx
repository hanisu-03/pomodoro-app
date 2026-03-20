'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Theme, ThemeName, getTheme } from "./themes";

type ThemeContextValue = {
  themeName: ThemeName;
  theme: Theme;
  toggleTheme: () => void;
  setThemeName: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "pomodoro-theme";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>("focus");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as
        | ThemeName
        | null;
      if (stored && (stored === "focus" || stored === "breeze")) {
        setThemeNameState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, themeName);
    } catch {
      // ignore
    }
  }, [themeName]);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeNameState((prev) => (prev === "focus" ? "breeze" : "focus"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeName,
      theme: getTheme(themeName),
      toggleTheme,
      setThemeName,
    }),
    [themeName, toggleTheme, setThemeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

