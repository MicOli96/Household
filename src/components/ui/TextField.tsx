import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Props = TextInputProps;

// Textfältet från "Skapa en ny syssla". Tar samma props som TextInput,
// t.ex. placeholder, value, onChangeText och multiline.
//
// TODO (Sebastian): lägg till en prop `error?: string`. När den finns ska
// ramen bli röd (colors.danger) och felet visas i liten röd text under
// fältet, t.ex. "Titel måste fyllas i". Tips: lägg TextInput och felet i
// en View så att de hamnar under varandra.
export function TextField({ style, multiline, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
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
});
