import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getHousehold, householdError } from "../data/households";
import type { HouseholdSummary } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { Card, PillButton } from "./ui";

// Avgränsad läsvy för #23. Medlemsadministrationen byggs i sina egna issues.
export function HouseholdDetails({ id }: { id: string }) {
  const { colors } = useTheme();
  const [household, setHousehold] = useState<HouseholdSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getHousehold(id).then((result) => { if (active) setHousehold(result); })
      .catch((reason: unknown) => { if (active) setError(householdError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? <Text style={{ color: colors.textMuted }}>Hämtar hushållet...</Text> : null}
      {error ? <>
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
        <PillButton label="Försök igen" onPress={() => { setLoading(true); setError(""); setAttempt((value) => value + 1); }} />
      </> : null}
      {household ? <Card>
        <View style={styles.details}>
          <Text style={[styles.title, { color: colors.text }]}>{household.name}</Text>
          <Text selectable style={{ color: colors.text }}>Hushållskod: {household.code}</Text>
        </View>
      </Card> : null}
      <PillButton label="Mina hushåll" onPress={() => router.replace("/households")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  details: { gap: 12, flex: 1 },
  title: { fontSize: 22, fontWeight: "600" },
});
