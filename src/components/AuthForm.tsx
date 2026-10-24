import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuthForm } from "../hooks/useAuthForm";
import { useTheme } from "../theme/ThemeProvider";
import type { AuthMode } from "../utils/auth";
import { PillButton, TextField } from "./ui";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { colors } = useTheme();
  const registering = mode === "register";

  const {
    username,
    setUsername,
    password,
    setPassword,
    confirmationPassword,
    setConfirmationPassword,
    errors,
    message,
    loading,
    submit,
  } = useAuthForm(mode);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, !registering && styles.login]}
      >
        <View style={styles.form}>
          {!registering && (
            <View style={styles.brand}>
              <Text style={styles.logo}>🏠</Text>

              <Text style={[styles.title, { color: colors.text }]}>
                Hushållet
              </Text>

              <Text style={{ color: colors.textMuted }}>
                Dela på sysslorna hemma
              </Text>
            </View>
          )}

          <TextField
            accessibilityLabel="Användarnamn"
            placeholder="Användarnamn"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!loading}
            error={errors.username}
          />

          <TextField
            accessibilityLabel="Lösenord"
            placeholder="Lösenord"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={registering ? "new-password" : "current-password"}
            editable={!loading}
            error={errors.password}
            returnKeyType={registering ? "next" : "go"}
            onSubmitEditing={registering ? undefined : submit}
          />

          {registering && (
            <TextField
              accessibilityLabel="Upprepa lösenord"
              placeholder="Upprepa lösenord"
              value={confirmationPassword}
              onChangeText={setConfirmationPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              editable={!loading}
              error={errors.confirmPassword}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          )}

          {message ? (
            <Text
              accessibilityRole="alert"
              style={{ color: colors.danger }}
            >
              {message}
            </Text>
          ) : null}

          <PillButton
            label={loading ? "Vänta…" : registering ? "Skapa konto" : "Logga in"}
            variant="primary"
            disabled={loading}
            onPress={submit}
            style={styles.submit}
          />

          <View style={styles.links}>
            <Text style={{ color: colors.textMuted }}>
              {registering ? "Har du redan ett konto?" : "Har du inget konto?"}
            </Text>

            <Pressable
              accessibilityRole="link"
              disabled={loading}
              style={styles.link}
              onPress={() => router.replace(registering ? "/login" : "/register")}
            >
              <Text style={{ color: colors.primaryText }}>
                {registering ? "Logga in" : "Skapa konto"}
              </Text>
            </Pressable>
          </View>
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
    paddingBottom: 48,
  },

  login: {
    justifyContent: "center",
  },

  form: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    gap: 12,
  },

  brand: {
    alignItems: "center",
    gap: 8,
    marginBottom: 36,
  },

  logo: {
    fontSize: 56,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },

  submit: {
    marginTop: 16,
  },

  links: {
    alignItems: "center",
    marginTop: 16,
  },

  link: {
    padding: 12,
    minHeight: 44,
    justifyContent: "center",
  },

});
