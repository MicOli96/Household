import { StyleSheet, Text, View } from "react-native";
import { AvatarEmoji } from "../../theme/avatars";
import { useTheme } from "../../theme/ThemeProvider";

type Props = {
  emoji: AvatarEmoji;
  /** Diameter i pixlar. */
  size?: number;
  /** Ring runt avataren, t.ex. den valda i avatarväljaren. */
  selected?: boolean;
  /** Utgråad, t.ex. när någon annan i hushållet redan valt den. */
  disabled?: boolean;
};

// Djur-emoji, med ring när den är vald. Avatarens färg används i statistikens
// diagram, inte som bakgrund (se src/theme/avatars.ts).
export function Avatar({ emoji, size = 40, selected = false, disabled = false }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.ring,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: selected ? colors.text : "transparent",
          opacity: disabled ? 0.3 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
