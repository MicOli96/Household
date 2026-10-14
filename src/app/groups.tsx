import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Card, PillButton, TextField } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";
import { currentRotationMember, daysUntilRotation } from "../utils/rotation";

// Rotationsgrupper (#14). Ägaren samlar sysslor i en grupp som går runt
// mellan medlemmarna, t.ex. "Köket" som byter person varje vecka.
export default function Groups() {
  const { colors } = useTheme();
  const { groups, chores, members, currentMember, addGroup } = useHouseholdData();
  const [name, setName] = useState("");
  const [days, setDays] = useState("7");
  const [choreIds, setChoreIds] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const freeChores = chores.filter((c) => c.choreGroupId === null);

  function toggleChore(id: string) {
    setChoreIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function save() {
    const rotationDays = Number(days);
    if (!name.trim()) return setError("Gruppen behöver ett namn");
    if (!Number.isInteger(rotationDays) || rotationDays < 1)
      return setError("Ange antal dagar, minst 1");
    if (choreIds.length === 0) return setError("Välj minst en syssla");
    addGroup(name.trim(), rotationDays, choreIds);
    setName("");
    setChoreIds([]);
    setError(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {groups.map((group) => {
        const holder = currentRotationMember(group, members);
        const groupChores = chores.filter((c) => c.choreGroupId === group.id);
        const left = daysUntilRotation(group);
        return (
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupText}>
              <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {groupChores.map((c) => c.name).join(", ")}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                Byter var {group.rotationDays}:e dag, nästa om {left}{" "}
                {left === 1 ? "dag" : "dagar"}
              </Text>
            </View>
            {holder && <Avatar emoji={holder.avatar} size={32} />}
          </Card>
        );
      })}

      {currentMember.isOwner && (
        <>
          <Text style={[styles.heading, { color: colors.textMuted }]}>NY GRUPP</Text>
          <TextField placeholder="Namn, t.ex. Köket" value={name} onChangeText={setName} />
          <TextField
            placeholder="Byter person var … dag"
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
          />
          <View style={styles.chips}>
            {freeChores.map((chore) => {
              const picked = choreIds.includes(chore.id);
              return (
                <Pressable
                  key={chore.id}
                  onPress={() => toggleChore(chore.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: picked ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: picked ? "#FFFFFF" : colors.text }}>{chore.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {error && <Text style={{ color: colors.danger }}>{error}</Text>}
          <PillButton label="Skapa grupp" variant="primary" onPress={save} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  groupCard: {
    alignItems: "flex-start",
  },
  groupText: {
    flex: 1,
    gap: 4,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "600",
  },
  meta: {
    fontSize: 14,
  },
  heading: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
