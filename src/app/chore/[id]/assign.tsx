import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CheckRow, PillButton } from "../../../components/ui";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";

// Tilldela syssla (#13). Öppnas som modal från "Hantera" i dagsvyn.
// Ägaren bockar i vilka medlemmar som har sysslan.
export default function AssignChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const chore = useChore(id);
  const { members, groups, setAssignees } = useHouseholdData();
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

  function save() {
    setAssignees(chore!.id, [...selected]);
    router.back();
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
          left={<Text style={styles.emoji}>{member.avatar}</Text>}
        />
      ))}

      <PillButton label="Spara" variant="primary" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 26,
  },
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
