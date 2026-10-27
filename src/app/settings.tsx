import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { PillButton, SegmentedControl } from "../components/ui";
import { SignOutButton } from "../components/SignOutButton";
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
      <SegmentedControl options={modes} value={mode} onChange={setMode} />
      {/* Länkar som i Figma-skärmen "8 Inställningar". Hushåll och medlemmar
          är en egen flik sedan #104. */}
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