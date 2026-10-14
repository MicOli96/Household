import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { HouseholdHeader, HouseholdTitle } from "../components/HouseholdHeader";
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
      </View>

      <Placeholder
        title="Medlemmar och förfrågningar"
        area={3}
        issues="#16–#21, #26"
        todo={[
          "✎ i rubriken öppnar modalen \"Byt namn\" (#15, ägare)",
          "Medlemslista med avatarer, pausade markeras",
          "⋯ på en medlem öppnar modal: gör till ägare, pausa (ägare)",
          "Förfrågningar: acceptera eller neka (ägare)",
          "Lämna hushåll (#26)",
        ]}
        tables={[
          "households",
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
  },
  message: {
    padding: 24,
  },
});
