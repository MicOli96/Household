import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Props = {
  /** Texten i brickan, oftast antal dagar. */
  label: string | number;
  /** Röd bricka med vit text, t.ex. för försenade sysslor. */
  overdue?: boolean;
};

// Den lilla runda brickan till höger i sysslekorten ("7", "24").
export function Badge({ label, overdue = false }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: overdue ? colors.danger : colors.background },
      ]}
    >
      <Text style={[styles.text, { color: overdue ? "#FFFFFF" : colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
