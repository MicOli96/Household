import { Placeholder } from "../../components/Placeholder";

// TODO (område 2): Skapa konto, se #22.
// Byt ut Placeholder mot den riktiga vyn.
export default function Register() {
  return (
    <Placeholder
      title="Skapa konto"
      area={2}
      issues="#22"
      todo={[
        "Fält för e-post och lösenord",
        "Knapp \"Skapa konto\" som registrerar via backend",
        "Skicka vidare till profilen efteråt",
      ]}
      tables={["auth.users", "profiles"]}
      links={[
        { label: "Skapa konto", href: "/profile" },
      ]}
    />
  );
}
