export const colors = {
  light: {
    background: "#F2F2F2",
    card: "#FFFFFF",
    text: "#222222",
    textMuted: "#8A8A8A",
    primary: "#FF8A4C",
    danger: "#D15C6E",
    accent: "#FFD53D",
    border: "#E0E0E0",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#F2F2F2",
    textMuted: "#A0A0A0",
    primary: "#FF9A62",
    danger: "#E06B7D",
    accent: "#FFD53D",
    border: "#2C2C2C",
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof (typeof colors)["light"]]: string };