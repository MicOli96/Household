import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
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
import { useHouseholdData } from "../data/HouseholdData";
import {
  getMyProfile,
  householdError,
  listHouseholds,
  saveMyProfile,
} from "../data/households";
import {
  getMyName,
  NAME_MAX_LENGTH,
  profileError,
  saveMyName,
} from "../data/profile";
import { useTheme } from "../theme/ThemeProvider";
import { avatars, type AvatarEmoji } from "../theme/avatars";

const avatarOptions = Object.keys(avatars) as AvatarEmoji[];

export default function Profile() {
  const { colors } = useTheme();
  const { householdId } = useHouseholdData();
  const queryClient = useQueryClient();
  const [typedName, setTypedName] = useState<string | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [avatarSelection, setAvatarSelection] = useState<{
    householdId: string;
    avatar: AvatarEmoji;
  } | null>(null);
  const submitting = useRef(false);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getMyName });
  const name = typedName ?? profileQuery.data ?? "";
  const householdsQuery = useQuery({
    queryKey: ["households"],
    queryFn: listHouseholds,
    enabled: !householdId,
  });
  const householdOptions = householdsQuery.data ?? [];
  const avatarHouseholdId = householdId
    ?? householdOptions.find((household) => household.id === selectedHouseholdId)?.id
    ?? householdOptions[0]?.id
    ?? null;
  const avatarQuery = useQuery({
    queryKey: ["my-profile", avatarHouseholdId],
    queryFn: () => {
      if (!avatarHouseholdId) throw new Error("Välj ett hushåll.");
      return getMyProfile(avatarHouseholdId);
    },
    enabled: avatarHouseholdId !== null,
  });
  const avatar = avatarSelection?.householdId === avatarHouseholdId
    ? avatarSelection.avatar
    : avatarQuery.data?.avatar ?? null;
  const taken = avatarQuery.data?.taken ?? [];
  const loading = profileQuery.isLoading || householdsQuery.isLoading || avatarQuery.isLoading;
  const loadError = profileQuery.error
    ? profileError(profileQuery.error)
    : householdsQuery.error
      ? householdError(householdsQuery.error)
      : avatarQuery.error
        ? householdError(avatarQuery.error)
        : "";

  const saveNameMutation = useMutation({
    mutationFn: saveMyName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      setTypedName(null);
    },
  });
  const saveAvatarMutation = useMutation({
    mutationFn: ({
      householdId: targetHouseholdId,
      name: profileName,
      avatar: selectedAvatar,
    }: {
      householdId: string;
      name: string;
      avatar: AvatarEmoji;
    }) => saveMyProfile(targetHouseholdId, profileName, selectedAvatar),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-profile", variables.householdId] });
      if (variables.householdId === householdId) {
        queryClient.invalidateQueries({ queryKey: ["members"] });
        queryClient.invalidateQueries({ queryKey: ["chores"] });
      }
    },
  });
  const saving = saveNameMutation.isPending || saveAvatarMutation.isPending;
  const saveError = saveNameMutation.error
    ? profileError(saveNameMutation.error)
    : saveAvatarMutation.error
      ? householdError(saveAvatarMutation.error)
      : "";

  async function save() {
    if (submitting.current) return;

    submitting.current = true;
    try {
      try {
        await saveNameMutation.mutateAsync(name);
      } catch {
        // React Query retains the mutation error for display below.
        return;
      }
      if (avatarHouseholdId && avatar) {
        try {
          await saveAvatarMutation.mutateAsync({
            householdId: avatarHouseholdId,
            name,
            avatar,
          });
        } catch {
          // React Query retains the mutation error for display below.
          return;
        }
      }
      router.dismissTo("/households");
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
                saveNameMutation.reset();
                saveAvatarMutation.reset();
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
              error={saveError || loadError || undefined}
            />

            {!householdId && householdOptions.length > 1 ? (
              <View style={styles.householdPicker}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  AVATAR FÖR HUSHÅLL
                </Text>
                <View style={styles.householdOptions}>
                  {householdOptions.map((household) => (
                    <Pressable
                      key={household.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: avatarHouseholdId === household.id }}
                      onPress={() => {
                        setSelectedHouseholdId(household.id);
                        setAvatarSelection(null);
                        saveAvatarMutation.reset();
                      }}
                      style={[
                        styles.householdOption,
                        {
                          backgroundColor:
                            avatarHouseholdId === household.id ? colors.primary : colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: avatarHouseholdId === household.id ? "#FFFFFF" : colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {household.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {avatarHouseholdId ? (
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
                            if (avatarHouseholdId) {
                              setAvatarSelection({ householdId: avatarHouseholdId, avatar: emoji });
                            }
                            saveAvatarMutation.reset();
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

            {saveError || loadError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {saveError || loadError}
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
  householdPicker: {
    marginTop: 24,
  },
  householdOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  householdOption: {
    maxWidth: "100%",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
