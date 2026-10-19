import { router } from "expo-router";
import { useState } from "react";
import { logout } from "../data/auth";
import { StyleSheet, Text, View } from "react-native";
import { PillButton, SegmentedControl } from "../components/ui";
import { ThemeMode, useTheme } from "../theme/ThemeProvider";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Ljust" },
  { value: "dark", label: "Mörkt" },
  { value: "auto", label: "Auto" },
];

export default function Settings() {
  const { mode, setMode, colors } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setMessage("");

    try {
      const { error } = await logout();
      if (error) {
        setMessage("Kunde inte logga ut. Försök igen.");
      }
    } catch {
      setMessage("Kunde inte logga ut. Kontrollera anslutningen och försök igen.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Utseende</Text>
      <SegmentedControl options={modes} value={mode} onChange={setMode} />
      {/* Länkar som i Figma-skärmen "8 Inställningar". */}
      <PillButton label="Hushåll och medlemmar" onPress={() => router.push("/household")} />
      <PillButton label="Rotationsgrupper (ägare)" onPress={() => router.push("/groups")} />
      <PillButton label="Visa komponenter" onPress={() => router.push("/components")} />
      <PillButton label="Visa alla skärmar" onPress={() => router.push("/screens")} />
      {message ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{message}</Text> : null}
      <PillButton
        label={loggingOut ? "Loggar ut…" : "Logga ut"}
        disabled={loggingOut}
        onPress={handleLogout}
      />
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
});