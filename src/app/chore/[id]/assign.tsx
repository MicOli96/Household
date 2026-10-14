import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, PillButton } from "../../../components/ui";
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
    () => new Set(chore?.assignees.map((m) => m.profileId) ?? []),
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

  function toggle(profileId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
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

      {members.map((member) => {
        const isSelected = selected.has(member.profileId);
        return (
          <Pressable
            key={member.profileId}
            onPress={() => toggle(member.profileId)}
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Avatar emoji={member.avatar} size={32} />
            <Text style={[styles.name, { color: colors.text }]}>{member.name}</Text>
            <Text style={[styles.check, { color: colors.primary }]}>
              {isSelected ? "✓" : ""}
            </Text>
          </Pressable>
        );
      })}

      <PillButton label="Spara" variant="primary" onPress={save} />
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  check: {
    fontSize: 20,
    fontWeight: "700",
  },
});
