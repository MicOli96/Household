import type { ChoreRow } from "../data/types";

// Reglerna för en syssla (#31). Samma gränser som i databasen: name är
// varchar(100), interval_days > 0 och weight är 1, 2, 4, 6 eller 8.
// Används när en syssla skapas och redigeras.

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
/** Energiskalan som gruppen bestämt, samma som chores.weight. */
export const WEIGHTS: readonly ChoreRow["weight"][] = [1, 2, 4, 6, 8];

export type ChoreInput = Pick<ChoreRow, "name" | "description" | "intervalDays" | "weight">;

export type ChoreErrors = Partial<Record<keyof ChoreInput, string>>;

/** Returnerar ett felmeddelande per ogiltigt fält, tomt objekt om allt stämmer. */
export function validateChore(chore: ChoreInput): ChoreErrors {
  const errors: ChoreErrors = {};
  const name = chore.name.trim();
  const description = chore.description.trim();

  if (!name) errors.name = "Sysslan behöver en titel.";
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Titeln får vara högst ${NAME_MAX_LENGTH} tecken.`;

  if (!description) errors.description = "Sysslan behöver en beskrivning.";
  else if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Beskrivningen får vara högst ${DESCRIPTION_MAX_LENGTH} tecken.`;
  }

  if (!Number.isInteger(chore.intervalDays) || chore.intervalDays < 1) {
    errors.intervalDays = "Ange hur ofta sysslan ska göras, minst var 1:a dag.";
  }

  if (!WEIGHTS.includes(chore.weight)) {
    errors.weight = `Värdet måste vara ${WEIGHTS.join(", ")}.`;
  }

  return errors;
}
