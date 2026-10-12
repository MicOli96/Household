import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Props = TextInputProps & {
  /** Felmeddelande under fältet, t.ex. "Titel måste fyllas i". Gör ramen röd. */
  error?: string;
};

// Textfältet från "Skapa en ny syssla". Tar samma props som TextInput,
// t.ex. placeholder, value, onChangeText och multiline.
export function TextField({ style, multiline, error, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  error: {
    fontSize: 13,
    marginLeft: 4,
  },
});
