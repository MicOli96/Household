import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Props = {
  label: string;
  checked: boolean;
  onPress: () => void;
  /** Något till vänster om texten, t.ex. en Avatar. */
  left?: ReactNode;
};

// Rad som bockas i och ur, t.ex. medlemmar i tilldelningen.
export function CheckRow({ label, checked, onPress, left }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.row,
        { backgroundColor: colors.card },
      ]}
    >
      {left}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.check, { color: colors.primaryText }]}>{checked ? "✓" : ""}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 10,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  check: {
    fontSize: 20,
    fontWeight: "700",
  },
});
