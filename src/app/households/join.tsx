import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { PillButton, TextField } from "../../components/ui";
import { NAME_MAX_LENGTH } from "../../data/profile";
import { useJoinHouseholdForm } from "../../hooks/useJoinHouseholdForm";
import { useTheme } from "../../theme/ThemeProvider";

export default function JoinHousehold() {
  const { colors } = useTheme();
  const { code, setCode, error, name, setName, nameError, isSubmitting, submit } = useJoinHouseholdForm();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Ange hushållets kod för att skicka en förfrågan till ägaren.
          </Text>

          <TextField
            accessibilityLabel="Hushållskod"
            placeholder="Ange hushållets kod"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isSubmitting}
            error={error}
          />

          <TextField
            accessibilityLabel="Ditt namn"
            placeholder="Ditt namn"
            value={name}
            onChangeText={setName}
            maxLength={NAME_MAX_LENGTH}
            autoCapitalize="words"
            editable={!isSubmitting}
            error={nameError}
            returnKeyType="send"
            onSubmitEditing={submit}
          />

          <PillButton
            label={isSubmitting ? "Skickar…" : "Skicka förfrågan"}
            onPress={submit}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
  },
  form: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    gap: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});
