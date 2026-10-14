import { Placeholder } from "../components/Placeholder";

// TODO (område 5): Rotationsgrupper, se #14.
// Byt ut Placeholder mot den riktiga vyn.
export default function Groups() {
  return (
    <Placeholder
      title="Rotationsgrupper"
      area={5}
      issues="#14"
      todo={[
        "Lista hushållets grupper av sysslor (ägare)",
        "Skapa grupp: namn, vilka sysslor, hur ofta den roterar (dagar)",
        "Visa vem som har gruppen just nu",
      ]}
      tables={[
        "chore_groups (name, rotation_days, start_date)",
        "chores.chore_group_id",
      ]}
    />
  );
}
