import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { validateHouseholdName } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { AppModal, PillButton, TextField } from "./ui";

type Props = {
  /** Namnet som står i fältet när dialogen öppnas. */
  currentName: string;
  onClose: () => void;
  /** Anropas med det nya namnet när det är godkänt. */
  onSave: (name: string) => void;
};

// Dialogen "Byt namn på hushållet" (7c i Figma). Öppnas med pennan i rubriken (#15).
// Skärmen visar den bara när den ska vara öppen, så fältet börjar alltid
// med det nuvarande namnet.
export function RenameHouseholdDialog({ currentName, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState("");

  function save() {
    const message = validateHouseholdName(name);
    if (message) {
      setError(message);
      return;
    }
    onSave(name.trim());
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
        maxLength={100}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
        error={error || undefined}
      />
      <PillButton label="Spara" variant="primary" onPress={save} />
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
