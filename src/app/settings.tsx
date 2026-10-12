import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PillButton } from "../components/ui";
import { ThemeMode, useTheme } from "../theme/ThemeProvider";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Ljust" },
  { value: "dark", label: "Mörkt" },
  { value: "auto", label: "Auto" },
];

export default function Settings() {
  const { mode, setMode, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Utseende</Text>
      <View style={styles.row}>
        {modes.map((m) => {
          const selected = m.value === mode;
          return (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              style={[
                styles.pill,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: selected ? "#FFFFFF" : colors.text }}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <PillButton label="Visa komponenter" onPress={() => router.push("/components")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
});