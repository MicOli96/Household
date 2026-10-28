import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, CheckRow, PillButton } from "../../../components/ui";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import type { Chore } from "../../../data/types";
import { useTheme } from "../../../theme/ThemeProvider";
import { errorMessage } from "../../../lib/errors";

// Tilldela syssla (#13). Öppnas som modal från "Tilldela syssla" i sysslans vy.
// Ägaren bockar i vilka medlemmar som har sysslan.
export default function AssignChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const chore = useChore(id);
  const { groups, loading } = useHouseholdData();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.textMuted }}>Hämtar sysslan...</Text>
      </View>
    );
  }

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

  return <AssignForm chore={chore} />;
}

// Visas först när sysslan är hämtad, så att valet börjar med dem som har
// sysslan nu. Annars börjar valet tomt och Spara tar bort alla tilldelningar.
function AssignForm({ chore }: { chore: Chore }) {
  const { colors } = useTheme();
  const { members, setAssignees } = useHouseholdData();
  const [selected, setSelected] = useState(() => new Set(chore.assignees.map((m) => m.userId)));

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: () => setAssignees(chore.id, [...selected]),
    onSuccess: () => router.back(),
  });
  // Knappen är tryckt tills skärmen har stängts.
  const saving = saveMutation.isPending || saveMutation.isSuccess;
  const error = saveMutation.error ? errorMessage(saveMutation.error) : "";

  function save() {
    if (!saving) saveMutation.mutate();
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
