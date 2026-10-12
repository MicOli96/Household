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

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("auto");
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