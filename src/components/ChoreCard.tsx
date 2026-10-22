import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chore } from "../data/types";
import { useTheme } from "../theme/ThemeProvider";
import { daysSinceDone, isOverdue } from "../utils/chores";
import { Avatar, Badge, Card } from "./ui";

type Props = {
  chore: Chore;
  onPress: () => void;
  /** Öppnar tilldelningen. Skickas bara in för ägare, då visas "Hantera ›". */
  onManage?: () => void;
};

// Ett kort i dagsvyn: sysslans namn till vänster och status till höger.
// Status är antingen avatarerna för dem som gjort den idag,
// eller en bricka med antal dagar sedan den gjordes.
// Under kortet står vem sysslan är tilldelad (#13).
export function ChoreCard({ chore, onPress, onManage }: Props) {
  const { colors } = useTheme();
  const days = daysSinceDone(chore);
  const overdue = isOverdue(chore);
  const assigned =
    chore.assignees.length > 0
      ? `Tilldelad: ${chore.assignees.map((m) => m.name).join(", ")}`
      : "Inte tilldelad";

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card }]}>
      <Card onPress={onPress}>
        <Text style={[styles.name, { color: colors.text }]}>{chore.name}</Text>

        {chore.doneTodayBy.length > 0 ? (
          <View style={styles.avatars}>
            {chore.doneTodayBy.map((emoji, index) => (
              <Avatar key={`${emoji}-${index}`} emoji={emoji} size={24} />
            ))}
          </View>
        ) : (
          <Badge label={days ?? "–"} overdue={overdue} />
        )}
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.assigned, { color: colors.textMuted }]}>{assigned}</Text>
        {onManage && (
          <Pressable onPress={onManage} hitSlop={8}>
            <Text style={[styles.manage, { color: colors.primary }]}>Hantera ›</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  avatars: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  assigned: {
    fontSize: 14,
  },
  manage: {
    fontSize: 14,
    fontWeight: "600",
  },
});
