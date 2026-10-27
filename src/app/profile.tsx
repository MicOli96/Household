import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, PillButton, TextField } from "../components/ui";
import { getMyProfile, householdError, saveMyProfile } from "../data/households";
import { getMyName, NAME_MAX_LENGTH, saveMyName } from "../data/profile";
import { useTheme } from "../theme/ThemeProvider";
import { avatars, type AvatarEmoji } from "../theme/avatars";

const avatarOptions = Object.keys(avatars) as AvatarEmoji[];

// Profilen för ett hushåll (#106). Namn och djur hör till hushållet, så
// profilen öppnas från flikarna med hushållets id och ändrar bara det
// hushållet.
export default function Profile() {
  const { colors } = useTheme();
  const { householdId } = useLocalSearchParams<{ householdId?: string }>();
  const queryClient = useQueryClient();
  const [typedName, setTypedName] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarEmoji | null>(null);
  const submitting = useRef(false);

  const myProfileQuery = useQuery({
    queryKey: ["my-profile", householdId],
    queryFn: () => getMyProfile(householdId as string),
    enabled: !!householdId,
  });
  // Namnet på kontot föreslås tills man har ett namn i hushållet.
  const accountNameQuery = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const name = typedName ?? (myProfileQuery.data?.name || accountNameQuery.data || "");
  const avatar = selectedAvatar ?? myProfileQuery.data?.avatar ?? null;
  const taken = myProfileQuery.data?.taken ?? [];
  const loading = myProfileQuery.isLoading || accountNameQuery.isLoading;
  const loadError = !householdId
    ? "Öppna profilen från ett hushåll."
    : myProfileQuery.error
      ? householdError(myProfileQuery.error)
      : "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      await saveMyProfile(householdId as string, name, avatar);
      // Namnet på kontot är bara ett förslag när man går med i nästa hushåll,
      // så det gör inget om det inte går att spara.
      await saveMyName(name).catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile", householdId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["members", householdId] });
      queryClient.invalidateQueries({ queryKey: ["chores"] });
    },
  });
  const saving = saveMutation.isPending;
  const saveError = saveMutation.error ? householdError(saveMutation.error) : "";
  const error = saveError || loadError;

  async function save() {
    if (submitting.current || !householdId) return;

    submitting.current = true;
    try {
      try {
        await saveMutation.mutateAsync();
      } catch {
        // React Query retains the mutation error for display below.
        return;
      }
      // Tillbaka till fliken man kom ifrån. Öppnas profilen direkt på webben
      // finns ingen historik, och då går vi till Sysslor.
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            <TextField
              accessibilityLabel="Ditt namn"
              value={name}
              onChangeText={(value) => {
                setTypedName(value);
                saveMutation.reset();
              }}
              placeholder="Ditt namn"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              maxLength={NAME_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={save}
              editable={!saving && !!householdId}
              style={styles.nameInput}
              error={error || undefined}
            />

            {householdId ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  VÄLJ AVATAR
                </Text>
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((emoji) => {
                    const selected = avatar === emoji;
                    const disabled = taken.includes(emoji) && !selected;
                    return (
                      <Pressable
                        key={emoji}
                        accessibilityRole="button"
                        accessibilityLabel={`${emoji}${disabled ? ", upptagen" : ""}`}
                        accessibilityState={{ selected, disabled }}
                        onPress={() => {
                          if (!disabled) {
                            setSelectedAvatar(emoji);
                            saveMutation.reset();
                          }
                        }}
                        disabled={disabled || saving}
                        style={styles.avatarOption}
                      >
                        <Avatar
                          emoji={emoji}
                          size={56}
                          selected={selected}
                          disabled={disabled}
                        />
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.helper, { color: colors.textMuted }]}>
                  Utgråade är upptagna i hushållet
                </Text>
              </View>
            ) : null}

            {error ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {error}
              </Text>
            ) : null}

            <PillButton
              label={saving ? "Sparar..." : "Spara"}
              variant="primary"
              onPress={save}
              disabled={saving || loading || !householdId}
              style={styles.saveButton}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  loading: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 18,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  avatarOption: {
    width: "25%",
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    marginTop: 12,
    fontSize: 13,
  },
  error: {
    marginTop: 16,
    fontSize: 13,
  },
  saveButton: {
    width: "100%",
    marginTop: 48,
    paddingVertical: 14,
  },
});
