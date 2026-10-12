// De åtta avatarerna från uppgiften och deras färger.
// Samma färger som i Figma, de används också i statistikens cirkeldiagram.
export const avatars = {
  "🦊": "#FF8A4C",
  "🐷": "#F4A6B8",
  "🐸": "#7BC67E",
  "🐥": "#FFD53D",
  "🐙": "#D15C6E",
  "🐬": "#5BA8E6",
  "🦉": "#A67C52",
  "🦄": "#B38FE0",
} as const;

export type AvatarEmoji = keyof typeof avatars;
