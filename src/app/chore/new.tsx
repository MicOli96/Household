import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ChoreForm } from "../../components/ChoreForm";
import { PillButton } from "../../components/ui";
import { choreError } from "../../data/chores";
import { useHouseholdData } from "../../data/HouseholdData";
import { useTheme } from "../../theme/ThemeProvider";

// Skapa en ny syssla (#28, #31). Bild och ljud (#33) läggs till senare.
export default function NewChore() {
  const { colors } = useTheme();
  const { addChore, currentMember, loading } = useHouseholdData();

  if (loading) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.textMuted }}>Hämtar hushållet...</Text>
      </View>
    );
  }

  // Man kan komma hit utan knappen, t.ex. via "Alla skärmar".
  if (!currentMember?.isOwner) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.text }}>Bara ägare kan lägga till sysslor.</Text>
        <PillButton label="Tillbaka" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ChoreForm
      onSave={async (values) => {
        try {
          await addChore(values);
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
