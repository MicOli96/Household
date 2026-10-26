import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChoreRow } from "../data/types";
import { useTheme } from "../theme/ThemeProvider";
import { ChoreErrors, DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, validateChore } from "../utils/choreValidation";
import { IntervalPicker, WeightPicker } from "./ChorePickers";
import { Badge, Card, TextField } from "./ui";

/** Det som fylls i i formuläret. */
export type ChoreFormValues = {
  name: string;
  description: string;
  /** Hur ofta sysslan ska göras, i dagar. */
  intervalDays: number;
  /** Hur energikrävande sysslan är. */
  weight: ChoreRow["weight"];
};

type Props = {
  /** Startvärden, t.ex. sysslan som redigeras (#34). Tomt för en ny syssla. */
  initial?: ChoreFormValues;
  /**
   * Anropas med värdena när titeln är ifylld. Formuläret väntar tills
   * sparandet är klart och visar felet om det misslyckas.
   */
  onSave: (values: ChoreFormValues) => Promise<void>;
  onClose: () => void;
};

const ICON_SIZE = 28;

// Ikonen i Spara och Stäng: ett + eller × i en ring, som i Figma. Ritas själv
// i stället för tecknen ⊕ och ⊗, som blir för små och för täta i typsnittet.
function CircleIcon({ symbol, color }: { symbol: "+" | "×"; color: string }) {
  const { colors } = useTheme();
  // Fylld cirkel i stället för en ring (#77).
  return (
    <View style={[styles.icon, { backgroundColor: color }]}>
      <Text style={[styles.iconSymbol, { color: colors.card }]}>{symbol}</Text>
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
  // Samma startvärden som i Figma: var 7:e dag, värde 2.
  const [intervalDays, setIntervalDays] = useState(initial?.intervalDays ?? 7);
  const [weight, setWeight] = useState<ChoreRow["weight"]>(initial?.weight ?? 2);
  // Vilket kort som visar sin väljare i stället för värdet, eller null.
  const [picking, setPicking] = useState<"interval" | "weight" | null>(null);
  const [errors, setErrors] = useState<ChoreErrors>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    // Ogiltiga värden hindrar sparandet och visas vid fältet (#31).
    const found = validateChore({ name, description, intervalDays, weight });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave({ name, description, intervalDays, weight });
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Kunde inte spara sysslan.");
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.fields} keyboardShouldPersistTaps="handled">
        <TextField
          placeholder="Titel"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          maxLength={NAME_MAX_LENGTH}
          error={errors.name}
        />
        <TextField
          placeholder="Beskrivning"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          maxLength={DESCRIPTION_MAX_LENGTH}
          error={errors.description}
          multiline
        />

        {/* Ett tryck på kortet visar väljaren i kortet, ett val visar värdet igen. */}
        {picking === "interval" ? (
          <Card>
            <IntervalPicker
              selected={intervalDays}
              onSelect={(days) => {
                setIntervalDays(days);
                setPicking(null);
              }}
            />
          </Card>
        ) : (
          <Card onPress={() => setPicking("interval")}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Återkommer:</Text>
            <View style={styles.interval}>
              <Text style={[styles.intervalText, { color: colors.text }]}>var</Text>
              {/* Röd som i Figma. */}
              <Badge label={intervalDays} overdue />
              <Text style={[styles.intervalText, { color: colors.text }]}>dag</Text>
            </View>
          </Card>
        )}

        {picking === "weight" ? (
          <Card>
            <WeightPicker
              selected={weight}
              onSelect={(value) => {
                setWeight(value);
                setPicking(null);
              }}
            />
          </Card>
        ) : (
          <Card onPress={() => setPicking("weight")}>
            <View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Värde:</Text>
              <Text style={[styles.rowHint, { color: colors.textMuted }]}>
                Hur energikrävande är sysslan?
              </Text>
            </View>
            <Badge label={weight} />
          </Card>
        )}

        {errors.intervalDays || errors.weight ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {errors.intervalDays ?? errors.weight}
          </Text>
        ) : null}
        {saveError ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>{saveError}</Text>
        ) : null}
      </ScrollView>

      {/* Listen längst ner med Spara och Stäng, som i Figma. */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            (pressed || saving) && styles.pressed,
          ]}
          onPress={save}
          disabled={saving}
        >
          <CircleIcon symbol="+" color={colors.text} />
          <Text style={[styles.footerText, { color: colors.text }]}>
            {saving ? "Sparar..." : "Spara"}
          </Text>
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
  rowLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  rowHint: {
    fontSize: 13,
    marginTop: 2,
  },
  interval: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intervalText: {
    fontSize: 18,
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
