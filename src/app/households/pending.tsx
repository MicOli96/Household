import { Placeholder } from "../../components/Placeholder";

// TODO (område 2): Väntar på godkännande, se #25.
// Byt ut Placeholder mot den riktiga vyn.
export default function PendingHousehold() {
  return (
    <Placeholder
      title="Väntar på godkännande"
      area={2}
      issues="#25"
      todo={[
        "Text om att ägaren måste godkänna",
        "Gå vidare automatiskt när förfrågan godkänts",
        "Knapp tillbaka till mina hushåll",
      ]}
      tables={["household_members.is_approved"]}
      links={[
        { label: "Tillbaka till mina hushåll", href: "/households" },
      ]}
    />
  );
}
