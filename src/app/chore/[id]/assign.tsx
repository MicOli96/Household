import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, CheckRow, PillButton } from "../../../components/ui";
import { choreError } from "../../../data/chores";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";

// Tilldela syssla (#13). Öppnas som modal från "Tilldela syssla" i sysslans vy.
// Ägaren bockar i vilka medlemmar som har sysslan.
export default function AssignChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const chore = useChore(id);
  const { members, groups, setAssignees } = useHouseholdData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(
    () => new Set(chore?.assignees.map((m) => m.userId) ?? []),
  );

  if (!chore) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Sysslan hittades inte.</Text>
      </View>
    );
  }

  // Sysslor i en rotationsgrupp tilldelas automatiskt (#14).
  const group = groups.find((g) => g.id === chore.choreGroupId);
  if (group) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>{chore.name}</Text>
        <Text style={[styles.info, { color: colors.textMuted }]}>
          Sysslan ingår i rotationsgruppen &quot;{group.name}&quot; och har just nu{" "}
          {chore.assignees[0]?.name ?? "ingen"}. Den byter person automatiskt.
        </Text>
        <PillButton label="Visa rotationsgrupper" onPress={() => router.replace("/groups")} />
      </View>
    );
  }

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await setAssignees(chore!.id, [...selected]);
      router.back();
    } catch (reason) {
      setError(choreError(reason));
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{chore.name}</Text>
      <Text style={[styles.info, { color: colors.textMuted }]}>
        Välj vilka som ska göra sysslan.
      </Text>

      {members.map((member) => (
        <CheckRow
          key={member.userId}
          label={member.name}
          checked={selected.has(member.userId)}
          onPress={() => toggle(member.userId)}
          left={member.avatar ? <Avatar emoji={member.avatar} size={32} /> : undefined}
        />
      ))}

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <PillButton label={saving ? "Sparar..." : "Spara"} variant="primary" onPress={save} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  info: {
    fontSize: 15,
  },
});
