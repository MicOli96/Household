import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { PillButton, TextField } from "../../components/ui";
import { useJoinHouseholdForm } from "../../hooks/useJoinHouseholdForm";
import { useTheme } from "../../theme/ThemeProvider";

export default function JoinHousehold() {
  const { colors } = useTheme();
  const { code, setCode, error, isSubmitting, submit } = useJoinHouseholdForm();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={{ color: colors.textMuted }}>
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
