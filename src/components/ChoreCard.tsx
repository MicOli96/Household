import { StyleSheet, Text } from "react-native";
import { Chore } from "../data/mockChores";
import { useTheme } from "../theme/ThemeProvider";
import { daysSinceDone, isOverdue } from "../utils/chores";
import { Badge, Card } from "./ui";

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
    <Card onPress={onPress}>
      <Text style={[styles.name, { color: colors.text }]}>{chore.name}</Text>

      {chore.doneTodayBy.length > 0 ? (
        <Text style={styles.avatars}>{chore.doneTodayBy.join("")}</Text>
      ) : (
        // TODO (Sebastian, steg 3 i guiden): brickan ska bli röd när sysslan
        // är försenad. Badge har en prop `overdue` för det, och variabeln
        // `overdue` ovanför är redan uträknad åt dig.
        <Badge label={days ?? "–"} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  avatars: {
    fontSize: 20,
  },
});
