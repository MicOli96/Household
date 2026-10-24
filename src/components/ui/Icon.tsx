import { SymbolView } from "expo-symbols";

// Ikonerna som används i appen. SF Symbols på iPhone och Material Symbols på
// Android och webben, så att de ser likadana ut överallt. Tecken som ✎ och ⚙
// ser olika ut i olika typsnitt och blir ibland en tom ruta (#77).
const icons = {
  settings: { ios: "gearshape", android: "settings" },
  edit: { ios: "pencil", android: "edit" },
} as const;

export type IconName = keyof typeof icons;

type Props = {
  name: IconName;
  color: string;
  size?: number;
};

export function Icon({ name, color, size = 24 }: Props) {
  const { ios, android } = icons[name];
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      tintColor={color}
      size={size}
    />
  );
}
