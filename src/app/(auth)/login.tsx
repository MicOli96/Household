import { Placeholder } from "../../components/Placeholder";

// TODO (område 2): Logga in, se #22.
// Byt ut Placeholder mot den riktiga vyn.
export default function Login() {
  return (
    <Placeholder
      title="Logga in"
      area={2}
      issues="#22"
      todo={[
        "Fält för e-post och lösenord (TextField)",
        "Knapp \"Logga in\" som loggar in via backend",
        "Felmeddelande vid fel uppgifter (TextField error)",
        "Länk till \"Skapa konto\"",
      ]}
      tables={["auth.users"]}
      links={[
        { label: "Logga in", href: "/households" },
        { label: "Skapa konto", href: "/register" },
      ]}
    />
  );
}
