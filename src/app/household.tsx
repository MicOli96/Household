import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { HouseholdDetails } from "../components/HouseholdDetails";
import { HouseholdHeader, HouseholdTitle } from "../components/HouseholdHeader";
import { Placeholder } from "../components/Placeholder";

// Hårdkodat tills hushållet kan hämtas (Sebastians datalager, sedan Supabase).
const household = { name: "Familjen Svensson", code: "4F7K2P" };
const isOwner = true;

// TODO (område 3): Resten av hushållsvyn, se #16–#21 och #26.
// Byt ut Placeholder mot den riktiga vyn.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;
  if (householdId) return <HouseholdDetails key={householdId} id={householdId} />;

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
});
