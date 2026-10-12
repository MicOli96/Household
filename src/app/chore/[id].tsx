import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, PillButton } from "../../components/ui";
import { mockChores } from "../../data/mockChores";
import { useTheme } from "../../theme/ThemeProvider";
import { daysSinceDone, isOverdue } from "../../utils/chores";

// Detaljvyn för en syssla. Krav: "När en användare väljer en syssla ska
// beskrivningen av sysslan visas och det ska även med ett enkelt tryck gå
// att markera sysslan som gjord."
export default function ChoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [done, setDone] = useState(false);
  const chore = mockChores.find((c) => c.id === id);

  if (!chore) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Sysslan hittades inte.</Text>
      </View>
    );
  }

  const days = daysSinceDone(chore);
  const lastDone =
    days === null ? "Aldrig" : days === 0 ? "Idag" : `För ${days} dagar sedan`;

  // Sparas inte någonstans än. När backend finns ska det här skapa en rad
  // för vem som gjorde sysslan och när (issue #12).
  function markAsDone() {
    setDone(true);
    setTimeout(() => router.back(), 600);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: chore.name }} />

      <Card style={styles.info}>
        <View style={styles.infoContent}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Beskrivning</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            {chore.description}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Återkommer: var {chore.intervalDays}:e dag
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Värde: {chore.weight}
          </Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>SENAST GJORD</Text>
        <Text style={[styles.lastDone, { color: isOverdue(chore) ? colors.danger : colors.text }]}>
          {lastDone}
          {chore.doneTodayBy.length > 0 && ` av ${chore.doneTodayBy.join(" ")}`}
        </Text>
      </View>

      <PillButton
        label={done ? "✓  Markerad som gjord" : "✓  Markera som gjord"}
        variant="primary"
        onPress={markAsDone}
        style={styles.doneButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 20,
  },
  info: {
    alignItems: "flex-start",
  },
  infoContent: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
  },
  meta: {
    fontSize: 15,
  },
  section: {
    gap: 6,
  },
  lastDone: {
    fontSize: 16,
  },
  doneButton: {
    marginTop: "auto",
    marginBottom: 24,
    paddingVertical: 18,
  },
});
