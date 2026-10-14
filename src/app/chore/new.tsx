import { Placeholder } from "../../components/Placeholder";

// TODO (område 4): Skapa en ny syssla, se #28, #31, #33.
// Byt ut Placeholder mot den riktiga vyn.
// Bygg formuläret som en komponent (t.ex. src/components/ChoreForm.tsx)
// så att samma formulär används i chore/[id]/edit.tsx.
export default function NewChore() {
  return (
    <Placeholder
      title="Skapa en ny syssla"
      area={4}
      issues="#28, #31, #33"
      todo={[
        "Fält: titel, beskrivning, återkommer (dagar), värde (1, 2, 4, 6, 8)",
        "Värde och återkommer väljs i modaler, som i Figma",
        "Validering med TextField error",
        "Bild och ljud (VG)",
        "Knappar \"Spara\" och \"Stäng\"",
      ]}
      tables={[
        "chores (name, description, interval_days, weight, image_path, audio_path)",
      ]}
    />
  );
}
