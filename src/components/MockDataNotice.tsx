import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";

// Raden som säger att testdatan visas, innan ett hushåll är öppnat.
// Används i dagsvyn och statistiken (#63).
export function MockDataNotice() {
  const { colors } = useTheme();
  const { householdId } = useHouseholdData();
  if (householdId) return null;

  return (
    <Pressable onPress={() => router.push("/households")} style={styles.notice}>
      <Text style={{ color: colors.textMuted }}>
        Testdata visas. Tryck här och öppna ett hushåll för att se riktiga sysslor.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
