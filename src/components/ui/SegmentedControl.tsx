import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Option<T> = { value: T; label: string };

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Rad med val där ett i taget är markerat, t.ex. Ljust/Mörkt/Auto,
// värdet 1–8 på en syssla eller perioden i statistiken.
export function SegmentedControl<T extends string | number>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? colors.primary : colors.card,
              },
            ]}
          >
            <Text style={{ color: selected ? colors.onPrimary : colors.text }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segment: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
