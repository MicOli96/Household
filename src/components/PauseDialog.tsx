import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { isPausedToday, pauseError, PauseSummary, toDateString } from "../data/pauses";
import { useTheme } from "../theme/ThemeProvider";
import { AppModal, PillButton, SegmentedControl } from "./ui";

type Props = {
  name: string;
  /** Medlemmens pauser som pågår eller är planerade. */
  pauses: PauseSummary[];
  onClose: () => void;
  /** endDate = null betyder tills vidare. Dialogen väntar och visar felet om det misslyckas. */
  onAdd: (startDate: string, endDate: string | null) => Promise<void>;
  onStop: (pause: PauseSummary) => Promise<void>;
};

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

// "2026-11-03" blir "3 nov".
function formatDate(value: string): string {
  const [, month, day] = value.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

// new Date("2026-11-03") räknas i UTC och kan bli fel dag, därför delas texten upp.
function fromDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Dialogen "Pausa medlem" (#20). Det finns ingen Figma, så den följer
// RenameHouseholdDialog. Skärmen visar den bara när den ska vara öppen.
export function PauseDialog({ name, pauses, onClose, onAdd, onStop }: Props) {
  const { colors } = useTheme();
  const today = toDateString(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState<string | null>(null);
  // Vilket datum datumväljaren ändrar, eller null när den är stängd.
  const [picking, setPicking] = useState<"start" | "end" | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function pick(date: string) {
    if (picking === "start") {
      setStart(date);
      if (end !== null && end < date) setEnd(date);
    } else {
      setEnd(date);
    }
    setPicking(null);
    setError("");
  }

  async function run(action: () => Promise<void>) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(pauseError(reason));
    } finally {
      setSaving(false);
    }
  }

  const label = [styles.label, { color: colors.textMuted }];

  return (
    <AppModal visible title={`Pausa ${name || "medlemmen"}`} onClose={onClose}>
      {pauses.length > 0 && (
        <View style={styles.section}>
          <Text style={label}>PÅGÅENDE OCH PLANERADE</Text>
          {pauses.map((pause) => (
            <View key={pause.id} style={styles.pause}>
              <Text style={{ color: colors.text }}>
                {formatDate(pause.startDate)} – {pause.endDate ? formatDate(pause.endDate) : "tills vidare"}
              </Text>
              <Pressable onPress={() => run(() => onStop(pause))} disabled={saving} hitSlop={8}>
                <Text style={{ color: colors.danger }}>
                  {isPausedToday(pause) ? "Avsluta" : "Ta bort"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={label}>FRÅN</Text>
        <Pressable
          onPress={() => setPicking("start")}
          style={[styles.date, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>
            {start === today ? "Idag" : formatDate(start)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={label}>TILL</Text>
        <SegmentedControl
          options={[
            { value: "open", label: "Tills vidare" },
            { value: "date", label: end ? formatDate(end) : "Välj datum" },
          ]}
          value={end ? "date" : "open"}
          onChange={(value) => (value === "open" ? setEnd(null) : setPicking("end"))}
        />
      </View>

      {/* Android visar en egen ruta ovanpå, iPhone visar kalendern här i dialogen. */}
      {picking && (
        <DateTimePicker
          value={fromDateString(picking === "start" ? start : end ?? start)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={fromDateString(picking === "start" ? today : start)}
          onValueChange={(_, date) => pick(toDateString(date))}
          onDismiss={() => setPicking(null)}
        />
      )}

      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}

      <PillButton
        label={saving ? "Sparar..." : "Spara paus"}
        variant="primary"
        onPress={() => run(() => onAdd(start, end))}
        disabled={saving}
      />
      <Pressable onPress={onClose} hitSlop={8} style={styles.cancel}>
        <Text style={[styles.cancelText, { color: colors.textMuted }]}>Avbryt</Text>
      </Pressable>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  pause: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
  },
});
