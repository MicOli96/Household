import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart } from "../components/PieChart";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";
import { currentWeek, distribution } from "../utils/statistics";

// Statistik (#39, #40, #41): ett stort diagram med den viktade fördelningen
// och ett litet diagram per syssla. Förra veckan och förra månaden (#42, #43)
// läggs till som fler perioder, och tomma perioder ska döljas (#44).
export default function Statistics() {
  const { colors } = useTheme();
  const { completions, chores, members } = useHouseholdData();
  const period = currentWeek();
  const { total, perChore } = distribution(completions, chores, members, period);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Pilarna går mellan perioderna, ‹ tillbaka till dagsvyn. */}
      <View style={styles.periodRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.arrow, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.period, { color: colors.text }]}>{period.label}</Text>
        <Text style={[styles.arrow, { color: colors.textMuted, opacity: 0 }]}>›</Text>
      </View>

      {total.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Inga gjorda sysslor den här veckan än.
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
