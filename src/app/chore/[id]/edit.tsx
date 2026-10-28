import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  const { colors } = useTheme();
  const { editChore, archiveChore, removeChore, currentMember, loading } = useHouseholdData();
  const chore = useChore(id);

  function leave() {
    setShowDeleteDialog(false);
    router.dismissTo("/");
  }
  const archive = useMutation({ mutationFn: archiveChore, onSuccess: leave });
  const remove = useMutation({ mutationFn: removeChore, onSuccess: leave });
  // Arkivering och borttagning får inte köras samtidigt.
  const busy = archive.isPending || remove.isPending;
  const actionReason = archive.error ?? remove.error;
  const actionError = actionReason ? errorMessage(actionReason) : "";

  function clearError() {
    archive.reset();
    remove.reset();
  }

  function run(action: typeof archive) {
    if (!chore || !currentMember?.isOwner || busy) return;
    clearError();
    action.mutate(chore.id);
  }

  function closeDialog() {
    if (!busy) setShowDeleteDialog(false);
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
            if (busy) return;
            clearError();
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
        confirmLabel={remove.isPending ? "Tar bort…" : "Ta bort permanent"}
        onConfirm={() => run(remove)}
        onCancel={closeDialog}
        alternative={{ label: archive.isPending ? "Arkiverar…" : "Arkivera", onPress: () => run(archive) }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  message: { padding: 24, gap: 16 },
});
