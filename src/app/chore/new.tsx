import { Placeholder } from "../../components/Placeholder";

// TODO (område 4): Skapa en ny syssla, se #28, #31, #33.
// Byt ut Placeholder mot den riktiga vyn.
export default function NewChore() {
  return (
    <Placeholder
      title="Skapa en ny syssla"
      area={4}
      issues="#28, #31, #33"
      todo={[
        "Fält: titel, beskrivning, återkommer (dagar), värde (1, 2, 4, 6, 8)",
        "Validering med TextField error",
        "Bild och ljud (VG)",
        "Knappar \"Spara\" och \"Stäng\"",
      ]}
    />
  );
}
