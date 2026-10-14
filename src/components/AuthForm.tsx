import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { authErrorMessage, validateAuth } from "../utils/auth";
import type { AuthErrors, AuthMode } from "../utils/auth";
import { PillButton, TextField } from "./ui";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { colors } = useTheme();
  const registering = mode === "register";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) {
      return;
    }

    const nextErrors = validateAuth(mode, email, password, confirmationPassword);

    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const { supabase } = await import("../lib/supabase");

      const credentials = { email: email.trim(), password };

      const { data, error } = registering
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

      if (error) {
        setMessage(authErrorMessage(error.code));
        return;
      }

      if (data.session) {
        router.replace(registering ? "/profile" : "/households");
        return;
      }

      if (registering) {
        setPassword("");
        setConfirmationPassword("");
        setConfirmation(true);
        return;
      }

      setMessage(authErrorMessage());
    } catch {
      setMessage(authErrorMessage());
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

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

          {confirmation ? (
            <>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.notice, { color: colors.text }]}
              >
                Kontrollera din inkorg. Om registreringen kan genomföras får du ett
                mejl för att bekräfta din e-postadress. Logga sedan in.
              </Text>

              <PillButton
                label="Till inloggning"
                variant="primary"
                onPress={() => router.replace("/login")}
              />
            </>
          ) : (
            <>
              <TextField
                accessibilityLabel="E-post"
                placeholder="E-post"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
                error={errors.email}
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
                  <Text style={{ color: colors.primary }}>
                    {registering ? "Logga in" : "Skapa konto"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
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

  notice: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },

});
