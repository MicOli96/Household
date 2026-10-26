// Kontrasterna följer WCAG AA (minst 4.5:1 för text), i både ljust och mörkt
// läge (#77). primary är fyllnadsfärgen för knappar, primaryText används när
// orange står som text, och onPrimary/onDanger är texten ovanpå färgerna.
export const colors = {
  light: {
    background: "#F2F2F2",
    card: "#FFFFFF",
    text: "#222222",
    textMuted: "#6B6B6B",
    primary: "#FF8A4C",
    primaryText: "#A84A14",
    onPrimary: "#1A1A1A",
    danger: "#B23A4E",
    onDanger: "#FFFFFF",
    accent: "#FFD53D",
    border: "#E0E0E0",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#F2F2F2",
    textMuted: "#A0A0A0",
    primary: "#FF9A62",
    primaryText: "#FF9A62",
    onPrimary: "#1A1A1A",
    danger: "#E06B7D",
    onDanger: "#121212",
    accent: "#FFD53D",
    border: "#2C2C2C",
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof (typeof colors)["light"]]: string };