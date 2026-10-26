import "@/lib/localStorage";
import { createContext, ReactNode, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { colors, ColorScheme, ThemeColors } from "./colors";

export type ThemeMode = "light" | "dark" | "auto";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: ColorScheme;
  colors: ThemeColors;
};

const STORAGE_KEY = "themeMode";

//Läser det sparade läget så att valet finns kvar efter omstart (#7).
//Temat sparas bara i telefonen, inte i Supabase.
function loadMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "auto";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "auto";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(loadMode);

  function setMode(next: ThemeMode) {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  const system = useColorScheme();
  const scheme: ColorScheme =
    mode === "auto" ? (system === "dark" ? "dark" : "light") : mode;

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, scheme, colors: colors[scheme] }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme must be used inside ThemeProvider");
  return theme;
}