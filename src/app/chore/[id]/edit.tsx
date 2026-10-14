import { Placeholder } from "../../../components/Placeholder";

// TODO (område 4): Redigera syssla, se #34, #35, #37.
// Byt ut Placeholder mot den riktiga vyn.
// Använd samma formulärkomponent som chore/new.tsx.
export default function EditChore() {
  return (
    <Placeholder
      title="Redigera syssla"
      area={4}
      issues="#34, #35, #37"
      todo={[
        "Samma formulär som \"Skapa en ny syssla\", ifyllt",
        "Knapp \"Ta bort\" öppnar en varningsmodal",
        "Varningen säger att statistiken försvinner och erbjuder \"Arkivera\" i stället",
      ]}
      tables={["chores", "chores.is_archived"]}
    />
  );
}
