import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SignOutButton } from "../../components/SignOutButton";
import { AppModal, Card, PillButton, TextField } from "../../components/ui";
import { createHousehold, householdError, listHouseholds, listPendingHouseholds, validateHouseholdName } from "../../data/households";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { useTheme } from "../../theme/ThemeProvider";

export default function Households() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [householdName, setHouseholdName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const submitting = useRef(false);
  const [message, setMessage] = useState("");

  // Båda nycklarna börjar med "households", så invalidateQueries({ queryKey: ["households"] })
  // märker båda listorna som gamla.
  const approved = useQuery({ queryKey: ["households"], queryFn: listHouseholds });
  const waiting = useQuery({ queryKey: ["households", "pending"], queryFn: listPendingHouseholds });
  const households = approved.data ?? [];
  const pending = waiting.data ?? [];
  const loading = approved.isLoading || waiting.isLoading;
  const loadError = approved.error || waiting.error ? householdError(approved.error ?? waiting.error) : "";

  const { refetch: refetchApproved } = approved;
  const { refetch: refetchWaiting } = waiting;
  const refetchAll = useCallback(() => {
    refetchApproved();
    refetchWaiting();
  }, [refetchApproved, refetchWaiting]);
  useRefreshOnFocus(refetchAll);

  const create = useMutation({
    mutationFn: createHousehold,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["households"] }),
  });
  const isCreating = create.isPending;

  function closeModal() {
    if (submitting.current) return;
    setShowCreateModal(false);
    setHouseholdName("");
    setNameError("");
  }

  async function handleCreate() {
    if (submitting.current) return;
    const validation = validateHouseholdName(householdName);
    setNameError(validation);
    if (validation) return;
    submitting.current = true;
    try {
      const household = await create.mutateAsync(householdName);
      setMessage(`Hushållet ”${household.name}” har skapats. Tryck på kortet för att öppna det.`);
      setShowCreateModal(false);
      setHouseholdName("");
    } catch (error) {
      setNameError(householdError(error));
    } finally {
      submitting.current = false;
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text }]}>Mina hushåll</Text>
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>{message}</Text> : null}
      {loading ? <Text style={{ color: colors.textMuted }}>Hämtar hushåll...</Text> : null}
      {loadError ? (
        <View style={styles.section}>
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>{loadError}</Text>
          <PillButton label="Försök igen" onPress={refetchAll} disabled={loading} />
        </View>
      ) : null}
      {!loading && !loadError && households.length === 0 && pending.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Du har inga hushåll ännu.</Text>
      ) : null}
      {households.map((household) => (
        <Card key={household.id} onPress={() => router.push({ pathname: "/household", params: { id: household.id } })}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{household.name}</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Card>
      ))}
      {pending.length > 0 ? (
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Väntar på godkännande</Text>
      ) : null}
      {pending.map((household) => (
        <Card key={household.id} onPress={() => router.push({ pathname: "/households/pending", params: { id: household.id } })}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{household.name}</Text>
          <Text style={{ color: colors.textMuted }}>Väntar</Text>
        </Card>
      ))}
      <PillButton label="Skapa nytt hushåll" variant="primary" disabled={loading} onPress={() => {
        setNameError("");
        setHouseholdName("");
        setMessage("");
        setShowCreateModal(true);
      }} />
      <PillButton label="Gå med i hushåll" onPress={() => router.push("/households/join")} />
      <PillButton label="Profil" onPress={() => router.push("/profile")} />
      <SignOutButton />
      <AppModal visible={showCreateModal} title="Skapa nytt hushåll" onClose={closeModal}
        footer={<>
          <PillButton label="Avbryt" onPress={closeModal} disabled={isCreating} />
          <PillButton label={isCreating ? "Skapar..." : "Skapa"} variant="primary" onPress={handleCreate} disabled={isCreating} />
        </>}>
        <TextField accessibilityLabel="Hushållets namn" placeholder="Hushållets namn" value={householdName}
          onChangeText={(value) => { setHouseholdName(value); setNameError(""); }}
          editable={!isCreating} error={nameError} />
      </AppModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "600" },
  cardTitle: { fontSize: 17, fontWeight: "600", flexShrink: 1 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginTop: 8 },
});
