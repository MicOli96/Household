import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { HOUSEHOLD_NAME_MAX_LENGTH, validateHouseholdName } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { AppModal, PillButton, TextField } from "./ui";
import { errorMessage } from "../lib/errors";

type Props = {
  /** Namnet som står i fältet när dialogen öppnas. */
  currentName: string;
  onClose: () => void;
  /**
   * Anropas med det nya namnet när det är godkänt. Dialogen väntar tills
   * sparandet är klart och visar felet om det misslyckas.
   */
  onSave: (name: string) => Promise<void>;
};

// Dialogen "Byt namn på hushållet" (7c i Figma). Öppnas med pennan i rubriken (#15).
// Skärmen visar den bara när den ska vara öppen, så fältet börjar alltid
// med det nuvarande namnet.
export function RenameHouseholdDialog({ currentName, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const message = validateHouseholdName(name);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim());
    } catch (reason) {
      setError(errorMessage(reason));
      setSaving(false);
    }
  }

  return (
    <AppModal visible title="Byt namn på hushållet" onClose={onClose}>
      <TextField
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError("");
        }}
        placeholder="Hushållets namn"
        maxLength={HOUSEHOLD_NAME_MAX_LENGTH}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
        error={error || undefined}
      />
      <PillButton
        label={saving ? "Sparar..." : "Spara"}
        variant="primary"
        onPress={save}
        disabled={saving}
      />
      <Pressable onPress={onClose} hitSlop={8} style={styles.cancel}>
        <Text style={[styles.cancelText, { color: colors.textMuted }]}>Avbryt</Text>
      </Pressable>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  cancel: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
  },
});
