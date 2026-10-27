import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text } from "react-native";
import { PillButton } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import { getHousehold, getMembershipStatus, householdError } from "../../data/households";
import { useTheme } from "../../theme/ThemeProvider";

// Hur ofta förfrågan kontrolleras medan skärmen är öppen.
const CHECK_INTERVAL_MS = 5000;

// Visas efter att man har skickat en förfrågan om att gå med i ett hushåll (#25).
// Öppnas med hushållets id: router.push({ pathname: "/households/pending", params: { id } }).
export default function PendingHousehold() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;

  // Frågar var femte sekund tills ägaren har svarat, sedan slutar den.
  const statusQuery = useQuery({
    queryKey: ["membership", householdId],
    queryFn: () => getMembershipStatus(householdId as string),
    enabled: !!householdId,
    refetchInterval: (query) =>
      query.state.data === "approved" || query.state.data === "denied" ? false : CHECK_INTERVAL_MS,
  });
  const status = statusQuery.data ?? null;
  const error = statusQuery.error ? householdError(statusQuery.error) : "";

  // Namnet går bara att läsa medan förfrågan finns kvar. React Query behåller
  // det senast hämtade namnet även om en senare hämtning misslyckas.
  const nameQuery = useQuery({
    queryKey: ["household", householdId],
    queryFn: () => getHousehold(householdId as string),
    enabled: !!householdId,
  });
  const name = nameQuery.data?.name ?? "";

  // När ägaren har svarat ska Mina hushåll visa det, och vid ja öppnas hushållet
  // på Sysslor. dismissTo stänger Mina hushåll, så tillbaka går inte dit (#104).
  useEffect(() => {
    if (!householdId || (status !== "approved" && status !== "denied")) return;
    queryClient.invalidateQueries({ queryKey: ["households"] });
    if (status === "approved") {
      openHousehold(householdId);
      router.dismissTo("/");
    }
  }, [status, householdId, openHousehold, queryClient]);

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
