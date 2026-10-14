import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppModal, Card, PillButton, TextField } from "../../components/ui";
import { createHousehold, householdError, listHouseholds, validateHouseholdName } from "../../data/households";
import type { HouseholdSummary } from "../../data/households";
import { useTheme } from "../../theme/ThemeProvider";

export default function Households() {
  const { colors } = useTheme();
  const [householdName, setHouseholdName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const submitting = useRef(false);
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setHouseholds(await listHouseholds());
    } catch (error) {
      setLoadError(householdError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listHouseholds().then((result) => { if (active) setHouseholds(result); })
      .catch((error: unknown) => { if (active) setLoadError(householdError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

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
    setIsCreating(true);
    try {
      const household = await createHousehold(householdName);
      setHouseholds((previous) => [...previous, household]);
      setLoadError("");
      setMessage(`Hushållet ”${household.name}” har skapats. Tryck på kortet för att öppna det.`);
      setShowCreateModal(false);
      setHouseholdName("");
    } catch (error) {
      setNameError(householdError(error));
    } finally {
      submitting.current = false;
      setIsCreating(false);
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
          <PillButton label="Försök igen" onPress={load} disabled={loading} />
          <PillButton label="Logga in" onPress={() => router.push("/login")} />
        </View>
      ) : null}
      {!loading && !loadError && households.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Du har inga hushåll ännu.</Text>
      ) : null}
      {households.map((household) => (
        <Card key={household.id} onPress={() => router.push({ pathname: "/household", params: { id: household.id } })}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{household.name}</Text>
          <Text style={{ color: colors.textMuted }}>›</Text>
        </Card>
      ))}
      <PillButton label="Skapa nytt hushåll" variant="primary" disabled={loading} onPress={() => {
        setNameError("");
        setHouseholdName("");
        setMessage("");
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
});
