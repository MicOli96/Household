import { Placeholder } from "../../../components/Placeholder";

// TODO (område 5): Tilldela syssla, se #13.
// Öppnas som modal från "Hantera" på ett sysslekort.
// Byt ut Placeholder mot den riktiga vyn.
export default function AssignChore() {
  return (
    <Placeholder
      title="Tilldela syssla"
      area={5}
      issues="#13"
      todo={[
        "Lista hushållets medlemmar med avatarer",
        "Bocka i vilka som har sysslan (ägare)",
        "Tilldelade sysslor syns för användaren i dagsvyn",
      ]}
      tables={["chore_assignments", "household_members"]}
    />
  );
}
