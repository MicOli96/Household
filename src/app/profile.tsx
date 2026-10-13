import { Placeholder } from "../components/Placeholder";

// TODO (område 2): Profil, se #27, #29, #30.
// Byt ut Placeholder mot den riktiga vyn.
export default function Profile() {
  return (
    <Placeholder
      title="Profil"
      area={2}
      issues="#27, #29, #30"
      todo={[
        "Fält för namn",
        "Avatarväljare med de 8 djuren (Avatar)",
        "Avatarer som är upptagna i hushållet är utgråade (Avatar disabled)",
        "Knapp \"Spara\"",
      ]}
      links={[
        { label: "Spara", href: "/households" },
      ]}
    />
  );
}
