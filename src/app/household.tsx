import { Placeholder } from "../components/Placeholder";

// TODO (område 3): Hushåll, se #15–#21 och #26.
// Byt ut Placeholder mot den riktiga vyn.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  return (
    <Placeholder
      title="Hushåll"
      area={3}
      issues="#15–#21, #26"
      todo={[
        "Hushållets namn och kod, ✎ öppnar modalen \"Byt namn\" (ägare)",
        "Medlemslista med avatarer, pausade markeras",
        "⋯ på en medlem öppnar modal: gör till ägare, pausa (ägare)",
        "Förfrågningar: acceptera eller neka (ägare)",
        "Lämna hushåll (#26)",
      ]}
      tables={[
        "households",
        "household_members (is_owner, is_approved, left_at)",
        "pauses",
      ]}
    />
  );
}
