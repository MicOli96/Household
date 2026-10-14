import { Placeholder } from "../../components/Placeholder";

// TODO (område 3): Mina hushåll, se #23, #38.
// Byt ut Placeholder mot den riktiga vyn.
export default function Households() {
  return (
    <Placeholder
      title="Mina hushåll"
      area={3}
      issues="#23, #38"
      todo={[
        "Lista hushållen användaren är med i",
        "Tryck på ett hushåll för att byta till det",
        "Knappar för att skapa nytt hushåll och gå med i ett",
      ]}
      tables={["households", "household_members"]}
      links={[
        { label: "Familjen Svensson (exempel)", href: "/" },
        { label: "Gå med i hushåll", href: "/households/join" },
        { label: "Skapa nytt hushåll", href: "/household" },
      ]}
    />
  );
}
