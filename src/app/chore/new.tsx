import { router } from "expo-router";
import { ChoreForm } from "../../components/ChoreForm";

// Skapa en ny syssla (#28, #31). Bild och ljud (#33) läggs till senare.
export default function NewChore() {
  return (
    <ChoreForm
      // Sparar inget än. Kopplas till Supabase i ett senare steg.
      onSave={() => {}}
      onClose={() => router.back()}
    />
  );
}
