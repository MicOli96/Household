import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ChoreCard } from "../components/ChoreCard";
import { PillButton } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";

// Dagsvyn: listar hushållets sysslor och visar vad som behöver göras.
// Krav: "Alla sysslor ska listas i en dagsvy och ge en översikt kring vad
// som behöver göras."
export default function DailyView() {
  const { colors } = useTheme();
  const { chores, currentMember } = useHouseholdData();

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

      <FlatList
        data={chores}
        keyExtractor={(chore) => chore.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChoreCard
            chore={item}
            onPress={() => router.push(`/chore/${item.id}`)}
            onManage={
              currentMember.isOwner
                ? () => router.push(`/chore/${item.id}/assign`)
                : undefined
            }
          />
        )}
      />

      <View style={styles.footer}>
        {/* Öppnar formuläret "Skapa en ny syssla" (område 4, src/app/chore/new.tsx). */}
        <PillButton label="⊕  Lägg till" onPress={() => router.push("/chore/new")} />

        {/* Tillfällig länk till temainställningarna. */}
        <PillButton label="✎  Ändra" onPress={() => router.push("/settings")} />
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
