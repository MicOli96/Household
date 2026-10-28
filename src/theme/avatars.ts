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

/** Avatarerna i ordning. avatars.id 1–8 i databasen är samma ordning. */
export const avatarEmojis = Object.keys(avatars) as AvatarEmoji[];

/** Avataren för ett avatar_id från databasen, eller null om det saknas. */
export function avatarFromId(avatarId: number | null | undefined): AvatarEmoji | null {
  if (!avatarId) return null;
  return avatarEmojis[avatarId - 1] ?? null;
}
