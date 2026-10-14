import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { HouseholdHeader, HouseholdTitle } from "../components/HouseholdHeader";
import { MemberList } from "../components/MemberList";
import { MemberMenu } from "../components/MemberMenu";
import { Placeholder } from "../components/Placeholder";
import {
  getHousehold,
  getMembers,
  householdError,
  HouseholdSummary,
  MemberSummary,
} from "../data/households";
import { useTheme } from "../theme/ThemeProvider";

// Visas när sidan öppnas utan id, t.ex. från "Alla skärmar".
const testHousehold: HouseholdSummary = { id: "test", name: "Familjen Svensson", code: "4F7K2P" };

// TODO (område 3): Resten av hushållsvyn, se #16–#21 och #26.
// Byt ut Placeholder mot den riktiga vyn.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;
  const [household, setHousehold] = useState<HouseholdSummary | null>(
    householdId ? null : testHousehold,
  );
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
  // Testhushållet (utan id) visar pennan så att den går att se under utvecklingen.
  const isOwner = householdId ? members.some((m) => m.isMe && m.isOwner) : true;

  // Medlemmen vars meny (⋯) är öppen, eller null när menyn är stängd.
  const [menuMember, setMenuMember] = useState<MemberSummary | null>(null);
  const closeMenu = () => setMenuMember(null);

  // TODO (#19): Gör till ägare. Sätt is_owner = true på medlemmens rad i
  // household_members (lägg funktionen i data/households.ts) och hämta om medlemmarna
  // så att "Ägare" visas i listan. Databasen tillåter bara ägare att göra det.
  function makeOwner(member: MemberSummary) {
    closeMenu();
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
          {error || "Hämtar hushållet..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rubriken högst upp visar hushållets namn i stället för "Hushåll", som i Figma. */}
      <Stack.Screen
        options={{
          headerTitle: () => <HouseholdTitle name={household.name} isOwner={isOwner} />,
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.header}>
        <HouseholdHeader code={household.code} />
        <MemberList members={members} canManage={isOwner} onOpenMenu={setMenuMember} />
      </View>

      <MemberMenu
        member={menuMember}
        onClose={closeMenu}
        onMakeOwner={makeOwner}
        onPause={pauseMember}
      />

      <Placeholder
        title="Kvar att bygga"
        area={3}
        issues="#15, #17–#20, #26"
        todo={[
          "✎ i rubriken öppnar modalen \"Byt namn\" (#15, ägare)",
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
