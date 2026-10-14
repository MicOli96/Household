import { useState } from "react";
import { Placeholder } from "../../components/Placeholder";
import { AppModal, TextField, PillButton } from "../../components/ui";

// TODO (område 3): Mina hushåll, se #23, #38.
// Byt ut Placeholder mot den riktiga vyn.
export default function Households() {
  const [householdName, setHouseholdName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Placeholder
        title="Mina hushåll"
        area={3}
        issues="#23, #38"
        todo={[
          "Lista hushållen användaren är med i",
          "Tryck på ett hushåll för att byta till det",
          "Knappar för att skapa nytt hushåll och gå med i ett",
        ]}
        tables={["households", "household_members"]}
        links={[
          { label: "Familjen Svensson (exempel)", href: "/" },
          { label: "Gå med i hushåll", href: "/households/join" },
        ]}
      />

      <PillButton
        label="Skapa nytt hushåll"
        onPress={() => setShowCreateModal(true)}
      />

      <AppModal
        visible={showCreateModal}
        title="Skapa nytt hushåll"
        onClose={() => setShowCreateModal(false)}
      >
        <TextField
          placeholder="Hushållets namn"
          value={householdName}
          onChangeText={setHouseholdName}
        />
      </AppModal>
    </>
  );
}
