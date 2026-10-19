import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChoreRow } from "../data/types";
import { useTheme } from "../theme/ThemeProvider";
import { WEIGHTS } from "../utils/choreValidation";

type Weight = ChoreRow["weight"];

// Fasta val i stället för 1–30 som i Figma, så att alla får plats utan att
// skrolla: varje dag, varannan dag, var tredje dag, varje vecka,
// varannan vecka och varje månad.
const DAYS = [1, 2, 3, 7, 14, 30];
const DAY_WIDTH = 40;

type Props<T> = {
  selected: T;
  onSelect: (value: T) => void;
};

// "Återkommer väljare" i Figma: siffrorna i en rad, det valda i en röd cirkel.
export function IntervalPicker({ selected, onSelect }: Props<number>) {
  const { colors } = useTheme();
  // En syssla som redigeras (#34) kan ha ett annat antal dagar, t.ex. 5.
  // Då läggs det till i raden så att det nuvarande värdet syns.
  const days = DAYS.includes(selected)
    ? DAYS
    : [...DAYS, selected].sort((a, b) => a - b);

  return (
    <View style={styles.days}>
      {days.map((day) => {
        const active = day === selected;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            accessibilityLabel={`Var ${day}:e dag`}
            accessibilityState={{ selected: active }}
            style={[styles.day, active && { backgroundColor: colors.danger }]}
          >
            <Text style={[styles.dayText, { color: active ? "#FFFFFF" : colors.text }]}>{day}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// "Värde väljare" i Figma: fem cirklar som blir mörkare ju tyngre sysslan är.
export function WeightPicker({ selected, onSelect }: Props<Weight>) {
  const { colors } = useTheme();

  return (
    <View style={styles.weights}>
      {WEIGHTS.map((weight, i) => {
        const active = weight === selected;
        return (
          <Pressable
            key={weight}
            onPress={() => onSelect(weight)}
            accessibilityLabel={`Värde ${weight}`}
            accessibilityState={{ selected: active }}
            style={[
              styles.weight,
              // Genomskinligt grått blir mörkare för varje steg, i både ljust och mörkt läge.
              { backgroundColor: `rgba(128, 128, 128, ${0.12 + i * 0.08})` },
              active && { borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.weightText, { color: colors.text }]}>{weight}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  days: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    borderRadius: DAY_WIDTH / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 20,
    fontWeight: "700",
  },
  weights: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weight: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  weightText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
