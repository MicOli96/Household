import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import { TextField } from "./ui";

/** Det som fylls i i formuläret. */
export type ChoreFormValues = {
  name: string;
  description: string;
};

type Props = {
  /** Startvärden, t.ex. sysslan som redigeras (#34). Tomt för en ny syssla. */
  initial?: ChoreFormValues;
  onSave: (values: ChoreFormValues) => void;
  onClose: () => void;
};

const ICON_SIZE = 28;

// Ikonen i Spara och Stäng: ett + eller × i en ring, som i Figma. Ritas själv
// i stället för tecknen ⊕ och ⊗, som blir för små och för täta i typsnittet.
function CircleIcon({ symbol, color }: { symbol: "+" | "×"; color: string }) {
  return (
    <View style={[styles.icon, { borderColor: color }]}>
      <Text style={[styles.iconSymbol, { color }]}>{symbol}</Text>
    </View>
  );
}

// Formuläret "Skapa en ny syssla" i Figma (#28, #31). Samma formulär ska
// användas för att redigera en syssla (#34), därför är det en egen komponent.
export function ChoreForm({ initial, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.fields} keyboardShouldPersistTaps="handled">
        <TextField placeholder="Titel" value={name} onChangeText={setName} maxLength={100} />
        <TextField
          placeholder="Beskrivning"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </ScrollView>

      {/* Listen längst ner med Spara och Stäng, som i Figma. */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          onPress={() => onSave({ name, description })}
        >
          <CircleIcon symbol="+" color={colors.text} />
          <Text style={[styles.footerText, { color: colors.text }]}>Spara</Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          onPress={onClose}
        >
          <CircleIcon symbol="×" color={colors.text} />
          <Text style={[styles.footerText, { color: colors.text }]}>Stäng</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fields: {
    padding: 16,
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSymbol: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "600",
    // Android lägger annars till luft ovanför texten, då hamnar tecknet för lågt.
    includeFontPadding: false,
  },
  divider: {
    width: 1,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.6,
  },
});
