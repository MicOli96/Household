import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppModal, Card, Icon, PillButton, TextField } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import { createHousehold, HOUSEHOLD_NAME_MAX_LENGTH, listHouseholds, listPendingHouseholds, saveNewMemberProfile, validateHouseholdName } from "../../data/households";
import { getMyName, NAME_MAX_LENGTH, validateName } from "../../data/profile";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { useTheme } from "../../theme/ThemeProvider";
import { errorMessage } from "../../lib/errors";

export default function Households() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const queryClient = useQueryClient();
  const [householdName, setHouseholdName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const [typedMemberName, setTypedMemberName] = useState<string | null>(null);
  const [memberNameError, setMemberNameError] = useState("");

  // Ett hushåll öppnas direkt på fliken Sysslor (#104).
  function open(id: string) {
    openHousehold(id);
    router.dismissTo("/");
  }

  // Båda nycklarna börjar med "households", så invalidateQueries({ queryKey: ["households"] })
  // märker båda listorna som gamla.
  const approved = useQuery({ queryKey: ["households"], queryFn: listHouseholds });
  const waiting = useQuery({ queryKey: ["households", "pending"], queryFn: listPendingHouseholds });
  const households = approved.data ?? [];
  const pending = waiting.data ?? [];
  const loading = approved.isLoading || waiting.isLoading;
  const loadError = approved.error || waiting.error ? errorMessage(approved.error ?? waiting.error) : "";

  const { refetch: refetchApproved } = approved;
  const { refetch: refetchWaiting } = waiting;
  const refetchAll = useCallback(() => {
    refetchApproved();
    refetchWaiting();
  }, [refetchApproved, refetchWaiting]);
  useRefreshOnFocus(refetchAll);

  const accountName = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const memberName = typedMemberName ?? accountName.data ?? "";

  const create = useMutation({
    mutationFn: async (names: { household: string; member: string }) => {
      const household = await createHousehold(names.household);
      try {
        await saveNewMemberProfile(household.id, names.member);
        return { household, profileSaved: true };
      } catch {
        return { household, profileSaved: false };
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["households"] }),
  });
  const isCreating = create.isPending;

  function closeModal() {
    if (isCreating) return;
    setShowCreateModal(false);
    setHouseholdName("");
    setNameError("");
    setTypedMemberName(null);
    setMemberNameError("");
  }

  function handleCreate() {
    if (isCreating) return;
    const householdValidation = validateHouseholdName(householdName);
    const memberValidation = validateName(memberName);
    setNameError(householdValidation);
    setMemberNameError(memberValidation);
    if (householdValidation || memberValidation) return;
    create.mutate({ household: householdName, member: memberName }, {
      onSuccess: ({ household, profileSaved }) => {
        setShowCreateModal(false);
        setHouseholdName("");
        setTypedMemberName(null);
        if (!profileSaved) {
          const title = "Ditt namn kunde inte sparas";
          const message = `Hushållet ”${household.name}” har skapats. Ändra ditt namn i profilen.`;
          // Alert gör ingenting på webben, där används webbläsarens egen ruta.
          if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
          else Alert.alert(title, message);
        }
        // Ett nyskapat hushåll öppnas av sig självt (#104).
        open(household.id);
      },
      onError: (error) => setNameError(errorMessage(error)),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Kugghjulet som på flikarna, så att Inställningar och Logga ut går
          att nå även utan hushåll (#107). */}
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.push("/settings")}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Inställningar"
              style={styles.headerButton}
            >
              <Icon name="settings" color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <Text style={[styles.title, { color: colors.text }]}>Mina hushåll</Text>
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
        <Card key={household.id} onPress={() => open(household.id)}>
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
        setShowCreateModal(true);
      }} />
      <PillButton label="Gå med i hushåll" onPress={() => router.push("/households/join")} />
      <AppModal visible={showCreateModal} title="Skapa nytt hushåll" onClose={closeModal}
        footer={<>
          <PillButton label="Avbryt" onPress={closeModal} disabled={isCreating} />
          <PillButton label={isCreating ? "Skapar..." : "Skapa"} variant="primary" onPress={handleCreate} disabled={isCreating} />
        </>}>
        <TextField accessibilityLabel="Hushållets namn" placeholder="Hushållets namn" value={householdName}
          onChangeText={(value) => { setHouseholdName(value); setNameError(""); }}
          maxLength={HOUSEHOLD_NAME_MAX_LENGTH} editable={!isCreating} error={nameError} />
        <TextField accessibilityLabel="Ditt namn" placeholder="Ditt namn" value={memberName}
          onChangeText={(value) => { setTypedMemberName(value); setMemberNameError(""); }}
          maxLength={NAME_MAX_LENGTH} autoCapitalize="words"
          editable={!isCreating} error={memberNameError} />
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
  headerButton: { paddingHorizontal: 16 },
});
