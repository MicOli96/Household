import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { PillButton, TextField } from "../components/ui";
import { getMyName, NAME_MAX_LENGTH, profileError, saveMyName, validateName } from "../data/profile";
import { useTheme } from "../theme/ThemeProvider";

// Profilen (#27). Visas direkt efter registreringen och från "Mina hushåll".
// TODO (område 2): avatarväljaren, se #29 och #30.
export default function Profile() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  // Fyller i det sparade namnet när profilen öppnas.
  useEffect(() => {
    let active = true;
    getMyName()
      .then((saved) => { if (active) setName(saved); })
      .catch((reason: unknown) => { if (active) setError(profileError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    if (submitting.current) return;
    const validation = validateName(name);
    setError(validation);
    if (validation) return;
    submitting.current = true;
    setSaving(true);
    try {
      await saveMyName(name);
      // Tillbaka till "Mina hushåll" om man kom därifrån, annars dit som ny skärm.
      router.dismissTo("/households");
    } catch (reason) {
      setError(profileError(reason));
    } finally {
      submitting.current = false;
      setSaving(false);
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
          setName(text);
          setError("");
        }}
        maxLength={NAME_MAX_LENGTH}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="done"
        onSubmitEditing={save}
        editable={!loading && !saving}
        error={error || undefined}
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
