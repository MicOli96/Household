import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chore } from "../data/mockChores";
import { useTheme } from "../theme/ThemeProvider";
import { daysSinceDone, isOverdue } from "../utils/chores";

type Props = {
  chore: Chore;
  onPress: () => void;
};

// Ett kort i dagsvyn: sysslans namn till vänster och status till höger.
// Status är antingen avatarerna för dem som gjort den idag,
// eller en bricka med antal dagar sedan den gjordes.
export function ChoreCard({ chore, onPress }: Props) {
  const { colors } = useTheme();
  const days = daysSinceDone(chore);
  const overdue = isOverdue(chore);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <Text style={[styles.name, { color: colors.text }]}>{chore.name}</Text>

      {chore.doneTodayBy.length > 0 ? (
        <Text style={styles.avatars}>{chore.doneTodayBy.join("")}</Text>
      ) : (
        // TODO (Sebastian, steg 3 i guiden): brickan ska vara röd
        // (colors.danger) med vit text när sysslan är försenad, annars grå
        // som nu. Variabeln `overdue` är redan uträknad åt dig.
        <View style={[styles.badge, { backgroundColor: colors.background }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {days ?? "–"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    // Skuggan i skissen. shadow* gäller iOS, elevation gäller Android.
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  avatars: {
    fontSize: 20,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
