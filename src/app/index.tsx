import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ChoreCard } from "../components/ChoreCard";
import { MockDataNotice } from "../components/MockDataNotice";
import { PillButton } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";

// Dagsvyn: listar hushållets sysslor och visar vad som behöver göras.
// Krav: "Alla sysslor ska listas i en dagsvy och ge en översikt kring vad
// som behöver göras."
export default function DailyView() {
  const { colors } = useTheme();
  const { chores, currentMember, householdId, loading, error, reload } = useHouseholdData();

  return (
    <View style={styles.container}>
      {/* Raden "‹ idag ›" från skissen. › går till statistiken (#41). */}
      <View style={styles.dateRow}>
        <Text style={[styles.arrow, { color: colors.text }]}>‹</Text>
        <Text style={[styles.dateText, { color: colors.text }]}>idag</Text>
        <Pressable onPress={() => router.push("/statistics")} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.text }]}>›</Text>
        </Pressable>
      </View>

      <MockDataNotice />
      {loading && <Text style={[styles.notice, { color: colors.textMuted }]}>Hämtar sysslor...</Text>}
      {error ? (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
          <PillButton label="Försök igen" onPress={reload} />
        </View>
      ) : null}
      {householdId && !loading && !error && chores.length === 0 && (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          Hushållet har inga sysslor ännu.
        </Text>
      )}

      <FlatList
        data={chores}
        keyExtractor={(chore) => chore.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChoreCard
            chore={item}
            onPress={() => router.push(`/chore/${item.id}`)}
            onManage={
              currentMember?.isOwner
                ? () => router.push(`/chore/${item.id}/assign`)
                : undefined
            }
          />
        )}
      />

      <View style={styles.footer}>
        {/* Vänta tills hushållet är hämtat, annars syns testdatans ägare en kort stund. */}
        {!loading && currentMember?.isOwner && (
          <PillButton label="⊕  Lägg till" onPress={() => router.push("/chore/new")} />
        )}

        {/* Tillfällig länk till temainställningarna. */}
        <PillButton
          label="✎  Ändra"
          onPress={() => router.push("/settings")}
          style={styles.alignRight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  arrow: {
    fontSize: 26,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  alignRight: {
    marginLeft: "auto",
  },
  notice: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 32,
  },
});
