import { CompletedBy } from "../../components/CompletedBy";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Icon, PillButton } from "../../components/ui";
import { choreError } from "../../data/chores";
import { useChore, useHouseholdData } from "../../data/HouseholdData";
import { useTheme } from "../../theme/ThemeProvider";
import { daysSinceDone, isOverdue } from "../../utils/chores";

// Detaljvyn för en syssla. Krav: "När en användare väljer en syssla ska
// beskrivningen av sysslan visas och det ska även med ett enkelt tryck gå
// att markera sysslan som gjord."
export default function ChoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const chore = useChore(id);
  const { markDone, currentMember } = useHouseholdData();

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

  // Blir en rad i completions i Supabase (#12).
  async function markAsDone() {
    // Bara ett tryck räknas, annars blir det flera rader i completions.
    if (!chore || done) return;
    setDone(true);
    setError("");
    try {
      await markDone(chore.id);
      setTimeout(() => router.back(), 600);
    } catch (reason) {
      setError(choreError(reason));
      setDone(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: chore.name,
          // Bara ägare kan redigera sysslan (#34).
          headerRight: currentMember?.isOwner
            ? () => (
                <Pressable
                  onPress={() => router.push(`/chore/${chore.id}/edit`)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Redigera sysslan"
                  style={styles.headerButton}
                >
                  <Icon name="edit" color={colors.primaryText} />
                </Pressable>
              )
            : undefined,
        }}
      />

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
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Tilldelad:{" "}
            {chore.assignees.length > 0
              ? chore.assignees.map((m) => m.name).join(", ")
              : "ingen"}
          </Text>
        </View>
      </Card>

      {/* Tilldelningen flyttades hit från dagsvyn och syns bara för ägare (#77). */}
      {currentMember?.isOwner && (
        <PillButton
          label="Tilldela syssla"
          onPress={() => router.push(`/chore/${chore.id}/assign`)}
        />
      )}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textMuted }]}>SENAST GJORD</Text>
        <Text style={[styles.lastDone, { color: isOverdue(chore) ? colors.danger : colors.text }]}>
          {lastDone}
        </Text>
        <CompletedBy members={chore.lastCompletedBy} size={32} />
      </View>

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
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
  headerButton: {
    paddingHorizontal: 8,
  },
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
