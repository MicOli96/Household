import { Placeholder } from "../../../components/Placeholder";

// TODO (område 4): Redigera syssla, se #34, #35, #37.
// Byt ut Placeholder mot den riktiga vyn.
export default function EditChore() {
  return (
    <Placeholder
      title="Redigera syssla"
      area={4}
      issues="#34, #35, #37"
      todo={[
        "Samma formulär som \"Skapa en ny syssla\", ifyllt",
        "Knapp \"Ta bort\" med varning och val att arkivera",
      ]}
    />
  );
}
