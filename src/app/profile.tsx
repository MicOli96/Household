import { router } from "expo-router";
import { useEffect, useState } from "react";
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
  validateProfileName,
} from "../data/households";
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

  useEffect(() => {
    let active = true;
    if (!householdId) return () => {
      active = false;
    };

    getMyProfile(householdId)
      .then((profile) => {
        if (!active) return;
        setName(profile.name);
        setAvatar(profile.avatar);
        setTaken(profile.taken);
      })
      .catch((reason: unknown) => {
        if (active) setError(householdError(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [householdId]);

  const visibleError = householdId
    ? error
    : "Öppna eller gå med i ett hushåll innan du ändrar profilen.";

  async function save() {
    if (!householdId) {
      setError("Öppna eller gå med i ett hushåll innan du ändrar profilen.");
      return;
    }
    const nameError = validateProfileName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!avatar) {
      setError("Välj ett djur.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await saveMyProfile(householdId, name, avatar);
      reload();
      router.back();
    } catch (reason) {
      setError(householdError(reason));
    } finally {
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

        {loading && householdId ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="Ditt namn"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={100}
              style={styles.nameInput}
            />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VÄLJ AVATAR</Text>
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
                        if (!disabled) setAvatar(emoji);
                      }}
                      disabled={disabled}
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

            {visibleError ? (
              <Text style={[styles.error, { color: colors.danger }]}>{visibleError}</Text>
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
