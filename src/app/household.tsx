import { Placeholder } from "../components/Placeholder";

// TODO (område 3): Hushåll, se #15–#21.
// Byt ut Placeholder mot den riktiga vyn.
export default function Household() {
  return (
    <Placeholder
      title="Hushåll"
      area={3}
      issues="#15–#21"
      todo={[
        "Hushållets namn (går att ändra) och kod",
        "Medlemslista med avatarer",
        "Förfrågningar: acceptera eller neka (ägare)",
        "Gör till ägare och pausa medlem (ägare)",
        "Lämna hushåll (#26)",
      ]}
    />
  );
}
