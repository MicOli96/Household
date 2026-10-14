import { Placeholder } from "../../components/Placeholder";

// TODO (område 2): Gå med i hushåll, se #24.
// Byt ut Placeholder mot den riktiga vyn.
export default function JoinHousehold() {
  return (
    <Placeholder
      title="Gå med i hushåll"
      area={2}
      issues="#24"
      todo={[
        "Fält för hushållets kod",
        "Skicka förfrågan till ägaren via backend",
        "Skicka vidare till \"Väntar på godkännande\"",
      ]}
      tables={["households.code", "household_members (is_approved = false)"]}
      links={[
        { label: "Skicka förfrågan", href: "/households/pending" },
      ]}
    />
  );
}
