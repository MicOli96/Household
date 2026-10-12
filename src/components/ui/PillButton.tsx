import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { shadow } from "./shadow";

type Variant = "default" | "primary" | "danger";

type Props = {
  label: string;
  onPress?: () => void;
  /**
   * default: vit knapp ("Lägg till", "Ändra").
   * primary: orange knapp för huvudvalet ("Spara", "Logga in").
   * danger: röd ram för farliga val ("Ta bort ändå").
   */
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  /** Gör knappen halvgenomskinlig och omöjlig att trycka på. */
  disabled?: boolean;
};

// Den runda knappen från skisserna.
export function PillButton({ label, onPress, variant = "default", style, disabled = false }: Props) {
  const { colors } = useTheme();

  const background = variant === "primary" ? colors.primary : colors.card;
  const textColor =
    variant === "primary" ? "#FFFFFF" : variant === "danger" ? colors.danger : colors.text;
  const borderColor = variant === "danger" ? colors.danger : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    ...shadow,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
