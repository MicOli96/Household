import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { PillButton } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import { getHousehold, getMembershipStatus, householdError, MembershipStatus } from "../../data/households";
import { useTheme } from "../../theme/ThemeProvider";

// Hur ofta förfrågan kontrolleras medan skärmen är öppen.
const CHECK_INTERVAL_MS = 5000;

// Visas efter att man har skickat en förfrågan om att gå med i ett hushåll (#25).
// Öppnas med hushållets id: router.push({ pathname: "/households/pending", params: { id } }).
export default function PendingHousehold() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;
  const [name, setName] = useState("");
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [error, setError] = useState("");

  // Kontrollerar förfrågan direkt och sedan med jämna mellanrum så länge skärmen visas.
  // När ägaren har godkänt öppnas hushållet av sig självt.
  useFocusEffect(useCallback(() => {
    if (!householdId) return;
    let active = true;

    async function check(id: string) {
      try {
        const result = await getMembershipStatus(id);
        if (!active) return;
        setError("");
        setStatus(result);
        if (result === "approved") {
          openHousehold(id);
          router.replace("/");
        }
      } catch (reason) {
        if (active) setError(householdError(reason));
      }
    }

    // Namnet går bara att läsa medan förfrågan finns kvar, så det hämtas en gång.
    getHousehold(householdId)
      .then((household) => { if (active) setName(household.name); })
      .catch(() => {});
    check(householdId);
    const timer = setInterval(() => check(householdId), CHECK_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [householdId, openHousehold]));

  const householdName = name ? `”${name}”` : "hushållet";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!householdId ? (
        <Text style={{ color: colors.danger }}>Det saknas ett hushåll att visa förfrågan för.</Text>
      ) : status === "denied" ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Förfrågan nekades</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Du fick inte gå med i {householdName}. Fråga ägaren om du tror att det är fel.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Förfrågan är skickad</Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            En ägare av {householdName} måste godkänna dig innan du kommer in.
            Hushållet öppnas av sig självt när förfrågan är godkänd. Förfrågan finns också under Mina hushåll.
          </Text>
        </>
      )}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
      <PillButton label="Tillbaka till mina hushåll" onPress={() => router.replace("/households")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  text: { fontSize: 16, textAlign: "center", lineHeight: 22 },
});
