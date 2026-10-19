import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { HouseholdHeader, HouseholdTitle } from "../components/HouseholdHeader";
import { MemberList } from "../components/MemberList";
import { MemberMenu } from "../components/MemberMenu";
import { RenameHouseholdDialog } from "../components/RenameHouseholdDialog";
import { PillButton } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import { Placeholder } from "../components/Placeholder";
import {
  getHousehold,
  getMembers,
  householdError,
  HouseholdSummary,
  MemberSummary,
  renameHousehold,
  setMemberOwner,
} from "../data/households";
import { useTheme } from "../theme/ThemeProvider";

// TODO (område 3): Resten av hushållsvyn, se #16–#21 och #26.
// Byt ut Placeholder mot den riktiga vyn.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;
  const [household, setHousehold] = useState<HouseholdSummary | null>(null);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [error, setError] = useState("");

  // Hämtar hushållet och medlemmarna från Supabase när sidan öppnas från "Mina hushåll".
  useEffect(() => {
    if (!householdId) return;
    let active = true;
    Promise.all([getHousehold(householdId), getMembers(householdId)])
      .then(([householdResult, membersResult]) => {
        if (!active) return;
        setHousehold(householdResult);
        setMembers(membersResult);
      })
      .catch((reason: unknown) => { if (active) setError(householdError(reason)); });
    // Om man lämnar sidan innan svaret kommit ska svaret inte sparas.
    return () => { active = false; };
  }, [householdId]);

  // Den inloggade är ägare om dess egen rad bland medlemmarna har isOwner.
  const isOwner = members.some((m) => m.isMe && m.isOwner);

  // Den som inte är godkänd än kommer inte in i hushållet, utan ser sin förfrågan (#25).
  const isPending = members.some((m) => m.isMe && !m.isApproved);
  useEffect(() => {
    if (isPending && householdId) {
      router.replace({ pathname: "/households/pending", params: { id: householdId } });
    }
  }, [isPending, householdId]);

  // Om dialogen "Byt namn på hushållet" är öppen.
  const [renaming, setRenaming] = useState(false);

  // Sparar det nya namnet i Supabase och visar det när databasen har svarat.
  async function rename(name: string) {
    if (!householdId) return;
    setHousehold(await renameHousehold(householdId, name));
    setRenaming(false);
  }

  // Medlemmen vars meny (⋯) är öppen, eller null när menyn är stängd.
  const [menuMember, setMenuMember] = useState<MemberSummary | null>(null);
  const closeMenu = () => setMenuMember(null);
  // Fel från valen i menyn, visas under medlemslistan.
  const [memberError, setMemberError] = useState("");

  // Gör medlemmen till ägare, eller tar bort ägarrollen om man råkat ge den (#19).
  // Hämtar sedan om listan så att "Ägare" stämmer.
  async function toggleOwner(member: MemberSummary) {
    closeMenu();
    if (!householdId) return;
    setMemberError("");
    try {
      await setMemberOwner(householdId, member.userId, !member.isOwner);
      setMembers(await getMembers(householdId));
    } catch (reason) {
      setMemberError(householdError(reason));
    }
  }

  // TODO (#20): Pausa medlem. Lägg till en rad i pauses (user_id, household_id,
  // start_date) och visa "Pausad" i listan. Pausade räknas inte med i statistiken.
  function pauseMember(member: MemberSummary) {
    closeMenu();
  }

  if (!household) {
    return (
      <View style={styles.message}>
        <Text style={{ color: error ? colors.danger : colors.textMuted }}>
          {error || (householdId ? "Hämtar hushållet..." : "Inget hushåll är valt.")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rubriken högst upp visar hushållets namn i stället för "Hushåll", som i Figma. */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HouseholdTitle
              name={household.name}
              isOwner={isOwner}
              onEdit={() => setRenaming(true)}
            />
          ),
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.header}>
        <HouseholdHeader code={household.code} />
        <MemberList members={members} canManage={isOwner} onOpenMenu={setMenuMember} />
        {memberError ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>{memberError}</Text>
        ) : null}

        {/* Väljer hushållet för dagsvyn och går dit (#12). */}
        <PillButton
          label="Visa sysslor"
          variant="primary"
          onPress={() => {
            openHousehold(household.id);
            router.dismissTo("/");
          }}
        />
      </View>

      {renaming && (
        <RenameHouseholdDialog
          currentName={household.name}
          onClose={() => setRenaming(false)}
          onSave={rename}
        />
      )}

      <MemberMenu
        member={menuMember}
        onClose={closeMenu}
        onToggleOwner={toggleOwner}
        onPause={pauseMember}
      />

      <Placeholder
        title="Kvar att bygga"
        area={3}
        issues="#17–#20, #26"
        todo={[
          "⋯ på en medlem öppnar menyn: gör till ägare, pausa (#19, #20, ägare)",
          "Pausade medlemmar markeras \"Pausad\" (#20)",
          "Förfrågningar: acceptera eller neka (#17, #18, ägare)",
          "Lämna hushåll (#26)",
        ]}
        tables={[
          "households (name)",
          "household_members (is_owner, is_approved, deleted_at)",
          "pauses",
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 0,
    gap: 24,
  },
  message: {
    padding: 24,
  },
});
