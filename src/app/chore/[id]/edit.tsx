import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ChoreForm } from "../../../components/ChoreForm";
import { PillButton } from "../../../components/ui";
import { choreError } from "../../../data/chores";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";

// Redigera en syssla (#34). Samma formulär som "Skapa en ny syssla", ifyllt.
// Ta bort och arkivera (#35, #37) läggs till senare.
export default function EditChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { editChore, currentMember, loading } = useHouseholdData();
  const chore = useChore(id);

  if (loading) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.textMuted }}>Hämtar sysslan...</Text>
      </View>
    );
  }

  // Man kan komma hit utan knappen, t.ex. via "Alla skärmar".
  if (!currentMember?.isOwner) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.text }}>Bara ägare kan redigera sysslor.</Text>
        <PillButton label="Tillbaka" onPress={() => router.back()} />
      </View>
    );
  }

  if (!chore) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.text }}>Sysslan hittades inte.</Text>
        <PillButton label="Tillbaka" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ChoreForm
      initial={{
        name: chore.name,
        description: chore.description,
        intervalDays: chore.intervalDays,
        weight: chore.weight,
      }}
      onSave={async (values) => {
        try {
          await editChore(chore.id, values);
        } catch (reason) {
          throw new Error(choreError(reason));
        }
        router.back();
      }}
      onClose={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 24,
    gap: 16,
  },
});
