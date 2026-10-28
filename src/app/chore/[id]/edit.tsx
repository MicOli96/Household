import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChoreForm } from "../../../components/ChoreForm";
import { ConfirmDialog, PillButton } from "../../../components/ui";
import { useChore, useHouseholdData } from "../../../data/HouseholdData";
import { useTheme } from "../../../theme/ThemeProvider";
import { errorMessage } from "../../../lib/errors";

// Redigering (#34), borttagning (#35) och arkivering med varning (#37).
export default function EditChore() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Ett gemensamt lås hindrar även att arkivering och borttagning körs samtidigt.
  const actionRef = useRef(false);
  const { colors } = useTheme();
  const { editChore, archiveChore, removeChore, currentMember, loading } = useHouseholdData();
  const chore = useChore(id);
  const busy = isArchiving || isDeleting;

  async function handleArchive() {
    if (!chore || !currentMember?.isOwner || actionRef.current) return;
    actionRef.current = true;
    setIsArchiving(true);
    setActionError("");
    try {
      await archiveChore(chore.id);
      setShowDeleteDialog(false);
      router.dismissTo("/");
    } catch (reason) {
      setActionError(errorMessage(reason));
    } finally {
      actionRef.current = false;
      setIsArchiving(false);
    }
  }

  async function handleDelete() {
    if (!chore || !currentMember?.isOwner || actionRef.current) return;
    actionRef.current = true;
    setIsDeleting(true);
    setActionError("");
    try {
      await removeChore(chore.id);
      setShowDeleteDialog(false);
      router.dismissTo("/");
    } catch (reason) {
      setActionError(errorMessage(reason));
    } finally {
      actionRef.current = false;
      setIsDeleting(false);
    }
  }

  function closeDialog() {
    if (!actionRef.current) setShowDeleteDialog(false);
  }

  if (loading) {
    return <View style={styles.message}>
      <Text style={{ color: colors.textMuted }}>Hämtar sysslan...</Text>
    </View>;
  }
  if (!currentMember?.isOwner) {
    return <View style={styles.message}>
      <Text style={{ color: colors.text }}>Bara ägare kan redigera sysslor.</Text>
      <PillButton label="Tillbaka" onPress={() => router.back()} />
    </View>;
  }
  if (!chore) {
    return <View style={styles.message}>
      <Text style={{ color: colors.text }}>Sysslan hittades inte.</Text>
      <PillButton label="Tillbaka" onPress={() => router.back()} />
    </View>;
  }

  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <Pressable disabled={busy} hitSlop={12} onPress={() => {
            if (actionRef.current) return;
            setActionError("");
            setShowDeleteDialog(true);
          }}>
            <Text style={{ color: colors.danger, fontSize: 16 }}>Ta bort syssla</Text>
          </Pressable>
        ),
      }} />
      <ChoreForm
        initial={{ name: chore.name, description: chore.description,
          intervalDays: chore.intervalDays, weight: chore.weight }}
        onSave={async (values) => {
          await editChore(chore.id, values);
          router.back();
        }}
        onClose={() => router.back()}
      />
      <ConfirmDialog
        visible={showDeleteDialog}
        title={`Ta bort ${chore.name}?`}
        message="Om du tar bort sysslan försvinner den och all tillhörande statistik från appen. Arkivera istället för att behålla statistiken."
        error={actionError}
        busy={busy}
        confirmLabel={isDeleting ? "Tar bort…" : "Ta bort permanent"}
        onConfirm={handleDelete}
        onCancel={closeDialog}
        alternative={{ label: isArchiving ? "Arkiverar…" : "Arkivera", onPress: handleArchive }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  message: { padding: 24, gap: 16 },
});
