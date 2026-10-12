import { Placeholder } from "../components/Placeholder";

// TODO (område 6): Statistik, se #39–#44.
// Byt ut Placeholder mot den riktiga vyn.
export default function Statistics() {
  return (
    <Placeholder
      title="Statistik"
      area={6}
      issues="#39–#44"
      todo={[
        "Cirkeldiagram med total fördelning (viktad)",
        "Ett litet diagram per syssla",
        "Perioder: nuvarande vecka, förra veckan, förra månaden",
        "Dölj perioder utan statistik",
      ]}
    />
  );
}
