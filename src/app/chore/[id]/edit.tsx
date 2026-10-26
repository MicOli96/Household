import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChoreForm } from "../../../components/ChoreForm";
import { ConfirmDialog, PillButton } from "../../../components/ui";
import { choreError } from "../../../data/chores";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";

// Redigera en syssla (#34). Samma formulär som "Skapa en ny syssla", ifyllt.
// Ta bort och arkivera (#35, #37) läggs till senare.
export default function EditChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const { colors } = useTheme();
  const { editChore, archiveChore, currentMember, loading } = useHouseholdData();
  const chore = useChore(id);

  async function handleArchive() {
    if (!chore || !currentMember?.isOwner || isArchiving) return;

    setIsArchiving(true);
    setActionError("");

    try {
      await archiveChore(chore.id);
      setShowDeleteDialog(false);
      router.dismissTo("/");
    } catch (reason) {
      setActionError(choreError(reason));
    } finally {
      setIsArchiving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.message}>
        <Text style={{ color: colors.textMuted }}>Hämtar sysslan...</Text>
      </View>
    );
  }

  // Man kan komma hit utan knappen, t.ex. via en direktlänk.
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
    <>
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
      <PillButton
        label="Ta bort syssla"
        variant="danger"
        onPress={() => {
          setActionError("");
          setShowDeleteDialog(true);
        }}
      />
      <ConfirmDialog
        visible={showDeleteDialog}
        error={actionError}
        busy={isArchiving}
        title="Ta bort syssla?"
        message="Om du tar bort sysslan permanent försvinner också all statistik för den. Du kan arkivera sysslan istället för att behålla statistiken. "
        confirmLabel="Ta bort permanent"
        onConfirm={() => { }}
        onCancel={() => setShowDeleteDialog(false)}
        alternative={{
          label: isArchiving ? "Arkiverar..." : "Arkivera",
          onPress: handleArchive,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 24,
    gap: 16,
  },
});
