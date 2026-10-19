import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PillButton, SegmentedControl } from "../components/ui";
import { SignOutButton } from "../components/SignOutButton";
import { useHouseholdData } from "../data/HouseholdData";
import { ThemeMode, useTheme } from "../theme/ThemeProvider";

const modes: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Ljust" },
  { value: "dark", label: "Mörkt" },
  { value: "auto", label: "Auto" },
];

export default function Settings() {
  const { mode, setMode, colors } = useTheme();
  const { householdId } = useHouseholdData();

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
      <SignOutButton />
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