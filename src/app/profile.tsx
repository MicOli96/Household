import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { useHouseholdData } from "../data/HouseholdData";
import {
  getMyProfile,
  householdError,
  saveMyProfile,
} from "../data/households";
import {
  getMyName,
  NAME_MAX_LENGTH,
  profileError,
  saveMyName,
  validateName,
} from "../data/profile";
import { useTheme } from "../theme/ThemeProvider";
import { avatars, type AvatarEmoji } from "../theme/avatars";

const avatarOptions = Object.keys(avatars) as AvatarEmoji[];

export default function Profile() {
  const { colors } = useTheme();
  const { householdId, reload } = useHouseholdData();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarEmoji | null>(null);
  const [taken, setTaken] = useState<AvatarEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const savedName = await getMyName();
        if (!active) return;
        setName(savedName);

        if (householdId) {
          const profile = await getMyProfile(householdId);
          if (!active) return;
          setAvatar(profile.avatar);
          setTaken(profile.taken);
        }
      } catch (reason: unknown) {
        if (active) {
          setError(householdId ? householdError(reason) : profileError(reason));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [householdId]);

  async function save() {
    if (submitting.current) return;

    const validation = validateName(name);
    setError(validation);
    if (validation) return;

    if (householdId && !avatar) {
      setError("Välj ett djur.");
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await saveMyName(name);
      if (householdId && avatar) {
        await saveMyProfile(householdId, name, avatar);
        reload();
      }
      router.dismissTo("/households");
    } catch (reason: unknown) {
      setError(householdId ? householdError(reason) : profileError(reason));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tillbaka"
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text style={[styles.back, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Din profil</Text>
          <View style={styles.headerSpacer} />
        </View>

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
                setName(value);
                setError("");
              }}
              placeholder="Ditt namn"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              maxLength={NAME_MAX_LENGTH}
              returnKeyType="done"
              onSubmitEditing={save}
              editable={!saving}
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
                            setAvatar(emoji);
                            setError("");
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
              disabled={saving || loading}
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
  header: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  back: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "300",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
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
