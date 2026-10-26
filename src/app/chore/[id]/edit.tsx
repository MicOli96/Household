import { router, useLocalSearchParams, Stack } from "expo-router";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ChoreForm } from "../../../components/ChoreForm";
import { PillButton, ConfirmDialog } from "../../../components/ui";
import { choreError } from "../../../data/chores";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";
import { useState } from "react";

// Redigera en syssla (#34). Samma formulär som "Skapa en ny syssla", ifyllt.
export default function EditChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { editChore, currentMember, loading, removeChore } = useHouseholdData();
  const chore = useChore(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await removeChore(id);
      setShowDeleteDialog(false);
    } catch (error) {
      setDeleteError(choreError(error));
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
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
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setShowDeleteDialog(true)} hitSlop={12}>
              <Text style={{ color: colors.danger, fontSize: 16 }}>Ta bort syssla</Text>
            </Pressable>
          ),
        }}
      />
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
      {deleteError && (
        <Text style={{ color: colors.danger, padding: 24 }}>{deleteError}</Text>
      )}
      <ConfirmDialog
        visible={showDeleteDialog}
        title={`Ta bort ${chore.name}?`}
        message="Sysslan och all tillhörande statistik kommer att tas bort."
        confirmLabel={isDeleting ? "Tar bort…" : "Ta bort ändå"}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isSubmitting={isDeleting}
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
