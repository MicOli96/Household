import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PillButton, SegmentedControl } from "../components/ui";
import { useAuthSession } from "../data/AuthSession";
import { useHouseholdData } from "../data/HouseholdData";
import { ThemeMode, useTheme } from "../theme/ThemeProvider";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Ljust" },
  { value: "dark", label: "Mörkt" },
  { value: "auto", label: "Auto" },
];

export default function Settings() {
  const { mode, setMode, colors } = useTheme();
  const { householdId, openHousehold } = useHouseholdData();
  const { signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  // Efter utloggningen skickar _layout.tsx vidare till inloggningen.
  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
      // Den som loggar in efteråt ska inte hamna i samma hushåll.
      openHousehold(null);
    } catch {
      setError("Kunde inte logga ut. Försök igen.");
      setSigningOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Utseende</Text>
      <SegmentedControl options={modes} value={mode} onChange={setMode} />
      {/* Länkar som i Figma-skärmen "8 Inställningar". */}
      {householdId && (
        <PillButton
          label="Hushåll och medlemmar"
          onPress={() => router.push({ pathname: "/household", params: { id: householdId } })}
        />
      )}
      <PillButton label="Rotationsgrupper (ägare)" onPress={() => router.push("/groups")} />
      <PillButton label="Byt hushåll" onPress={() => router.push("/households")} />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
      ) : null}
      <PillButton
        label={signingOut ? "Loggar ut..." : "Logga ut"}
        onPress={handleSignOut}
        disabled={signingOut}
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