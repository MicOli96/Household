import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CompletedBy } from "../components/CompletedBy";
import { PieChart } from "../components/PieChart";
import { Card } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import { getPauses, pauseError } from "../data/pauses";
import { useTheme } from "../theme/ThemeProvider";
import { distribution, periodsWithStatistics, withoutPausedDays } from "../utils/statistics";

// Statistik (#39–#44): ett stort diagram med den viktade fördelningen och ett
// litet diagram per syssla. Pilarna går mellan nuvarande vecka, förra veckan
// och förra månaden. Perioder utan gjorda sysslor visas inte (#44).
export default function Statistics() {
  const { colors } = useTheme();
  const { householdId, completions: allCompletions, allChores, members } = useHouseholdData();
  // Nyckeln börjar som pausnyckeln i hushållsvyn, så den hämtas om när någon pausas.
  const pausesQuery = useQuery({
    queryKey: ["pauses", householdId, "all"],
    queryFn: () => getPauses(householdId as string, true),
    enabled: !!householdId,
  });
  // Utan pauserna skulle pausade sysslor räknas, så diagrammen väntar på dem.
  const pausesMessage = pausesQuery.isLoading
    ? "Hämtar statistiken..."
    : pausesQuery.error
      ? pauseError(pausesQuery.error)
      : "";
  const completions = withoutPausedDays(allCompletions, pausesQuery.data ?? []);
  const periods = periodsWithStatistics(completions);
  const [index, setIndex] = useState(0);
  const period = periods[Math.min(index, periods.length - 1)];
  const { total, perChore } = period
    ? distribution(completions, allChores, members, period, pausesQuery.data ?? [])
    : { total: [], perChore: [] };
  const hasNext = index < periods.length - 1;
  // ? i rubriken visar vad diagrammen räknar, föreslaget av Hannes.
  const [showHelp, setShowHelp] = useState(false);

  function previous() {
    if (index === 0) router.back();
    else setIndex(index - 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => setShowHelp((value) => !value)}
              hitSlop={12}
              accessibilityLabel="Vad visar statistiken?"
              style={[styles.helpButton, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.helpText, { color: colors.text }]}>?</Text>
            </Pressable>
          ),
        }}
      />
      {/* Pilarna går mellan perioderna, ‹ på den första tillbaka till dagsvyn. */}
      <View style={styles.periodRow}>
        <Pressable onPress={previous} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.period, { color: colors.text }]}>{period?.label ?? "statistik"}</Text>
        <Pressable onPress={() => setIndex(index + 1)} disabled={!hasNext} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.text, opacity: hasNext ? 1 : 0 }]}>›</Text>
        </Pressable>
      </View>

      {showHelp && (
        <Card style={styles.help}>
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>Totalt</Text>
            <Text style={{ color: colors.text }}>
              Poäng för allt som gjorts under perioden. Varje syssla ger lika många poäng som
              sitt värde, så en tung syssla räknas mer än en lätt. Det som görs medan man är
              pausad räknas inte. Den som varit pausad en del av perioden räknas upp efter hur
              många dagar hen var med, så att alla jämförs rättvist.
            </Text>
            <Text style={[styles.helpTitle, { color: colors.text }]}>De små diagrammen</Text>
            <Text style={{ color: colors.text }}>
              Hur många gånger var och en har gjort sysslan, utan värde. Pauser räknas på samma
              sätt som i Totalt.
            </Text>
          </View>
        </Card>
      )}

      {pausesMessage ? (
        <Text
          accessibilityRole={pausesQuery.error ? "alert" : undefined}
          style={[styles.empty, { color: pausesQuery.error ? colors.danger : colors.textMuted }]}
        >
          {pausesMessage}
        </Text>
      ) : total.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Ingen statistik än. Den visas när någon har gjort en syssla.
        </Text>
      ) : (
        <>
          <View style={styles.big}>
            <PieChart slices={total} size={220} showAvatars />
            <Text style={[styles.caption, { color: colors.text }]}>Totalt</Text>
          </View>

          <View style={styles.grid}>
            {perChore.map(({ chore, slices }) => (
              <View key={chore.id} style={styles.small}>
                <PieChart slices={slices} size={80} />
                <CompletedBy members={slices.map((slice) => slice.member)} size={16} />
                <Text style={[styles.smallCaption, { color: colors.text }]} numberOfLines={1}>
                  {chore.name}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  helpButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    fontSize: 15,
    fontWeight: "700",
  },
  help: {
    alignItems: "flex-start",
  },
  helpContent: {
    flex: 1,
    gap: 6,
  },
  helpTitle: {
    fontWeight: "700",
  },
  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  arrow: {
    fontSize: 26,
  },
  period: {
    fontSize: 16,
    fontWeight: "600",
  },
  big: {
    alignItems: "center",
    gap: 8,
  },
  caption: {
    fontSize: 17,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
  },
  small: {
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  smallCaption: {
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
  },
});
