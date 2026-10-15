import { router } from "expo-router";
import { ChoreForm } from "../../components/ChoreForm";
import { choreError } from "../../data/chores";
import { useHouseholdData } from "../../data/HouseholdData";

// Skapa en ny syssla (#28, #31). Bild och ljud (#33) läggs till senare.
export default function NewChore() {
  const { addChore } = useHouseholdData();

  return (
    <ChoreForm
      onSave={async (values) => {
        try {
          // Sparas i Supabase om ett hushåll är öppnat, annars i testdatan.
          await addChore(values);
        } catch (reason) {
          // Visa bara våra egna meddelanden, inte tekniska fel.
          throw new Error(choreError(reason));
        }
        router.back();
      }}
      onClose={() => router.back()}
    />
  );
}
