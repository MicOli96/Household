import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "../components/PieChart";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";
import { distribution, periodsWithStatistics } from "../utils/statistics";

// Statistik (#39–#44): ett stort diagram med den viktade fördelningen och ett
// litet diagram per syssla. Pilarna går mellan nuvarande vecka, förra veckan
// och förra månaden. Perioder utan gjorda sysslor visas inte (#44).
export default function Statistics() {
  const { colors } = useTheme();
  const { completions, chores, members } = useHouseholdData();
  const periods = periodsWithStatistics(completions);
  const [index, setIndex] = useState(0);
  const period = periods[Math.min(index, periods.length - 1)];
  const { total, perChore } = period
    ? distribution(completions, chores, members, period)
    : { total: [], perChore: [] };
  const hasNext = index < periods.length - 1;

  function previous() {
    if (index === 0) router.back();
    else setIndex(index - 1);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {total.length === 0 ? (
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
