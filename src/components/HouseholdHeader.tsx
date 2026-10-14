import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Card } from "./ui";

type Props = {
  name: string;
  code: string;
};

// Översta delen av hushållsvyn: hushållets namn och koden för att gå med (#15).
export function HouseholdHeader({ name, code }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.info}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Hushållets namn</Text>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.info}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Kod för att gå med</Text>
          <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  info: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
  },
  code: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
