import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { PillButton, TextField } from "../components/ui";
import { getMyName, NAME_MAX_LENGTH, profileError, saveMyName, validateName } from "../data/profile";
import { useTheme } from "../theme/ThemeProvider";

// Profilen (#27). Visas direkt efter registreringen och från "Mina hushåll".
// TODO (område 2): avatarväljaren, se #29 och #30.
export default function Profile() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  // null tills man skriver, så att det sparade namnet visas utan att skriva över det man skriver.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const name = typed ?? profileQuery.data ?? "";
  const loading = profileQuery.isLoading;
  const loadError = profileQuery.error ? profileError(profileQuery.error) : "";

  // Namnet kopieras till alla hushåll man är med i, så medlemslistorna visar det också.
  const saveMutation = useMutation({
    mutationFn: saveMyName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
  const saving = saveMutation.isPending;

  async function save() {
    if (submitting.current) return;
    const validation = validateName(name);
    setError(validation);
    if (validation) return;
    submitting.current = true;
    try {
      await saveMutation.mutateAsync(name);
      // Tillbaka till "Mina hushåll" om man kom därifrån, annars dit som ny skärm.
      router.dismissTo("/households");
    } catch (reason) {
      setError(profileError(reason));
    } finally {
      submitting.current = false;
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.label, { color: colors.textMuted }]}>NAMN</Text>
      <TextField
        accessibilityLabel="Ditt namn"
        placeholder={loading ? "Hämtar namn..." : "Ditt namn"}
        value={name}
        onChangeText={(text) => {
          setTyped(text);
          setError("");
        }}
        maxLength={NAME_MAX_LENGTH}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="done"
        onSubmitEditing={save}
        editable={!loading && !saving}
        error={error || loadError || undefined}
      />
      <PillButton
        label={saving ? "Sparar..." : "Spara"}
        variant="primary"
        onPress={save}
        disabled={loading || saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
});
