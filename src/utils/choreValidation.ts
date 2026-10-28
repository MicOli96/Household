import { z } from "zod";
import type { ChoreRow } from "../data/types";

// Reglerna för en syssla (#31). Samma gränser som i databasen: name är
// varchar(100), interval_days > 0 och weight är 1, 2, 4, 6 eller 8.
// Används när en syssla skapas och redigeras.

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
/** Energiskalan som gruppen bestämt, samma som chores.weight. */
export const WEIGHTS: readonly ChoreRow["weight"][] = [1, 2, 4, 6, 8];

const INTERVAL_ERROR = "Ange hur ofta sysslan ska göras, minst var 1:a dag.";

export type ChoreInput = Pick<ChoreRow, "name" | "description" | "intervalDays" | "weight">;

export type ChoreErrors = Partial<Record<keyof ChoreInput, string>>;

const choreSchema = z.object({
  name: z.string().trim()
    .min(1, { error: "Sysslan behöver en titel." })
    .max(NAME_MAX_LENGTH, { error: `Titeln får vara högst ${NAME_MAX_LENGTH} tecken.` }),
  description: z.string().trim()
    .min(1, { error: "Sysslan behöver en beskrivning." })
    .max(DESCRIPTION_MAX_LENGTH, { error: `Beskrivningen får vara högst ${DESCRIPTION_MAX_LENGTH} tecken.` }),
  intervalDays: z.int({ error: INTERVAL_ERROR }).min(1, { error: INTERVAL_ERROR }),
  weight: z.literal(WEIGHTS, { error: `Värdet måste vara ${WEIGHTS.join(", ")}.` }),
});

/** Returnerar ett felmeddelande per ogiltigt fält, tomt objekt om allt stämmer. */
export function validateChore(chore: ChoreInput): ChoreErrors {
  const errors: ChoreErrors = {};
  const result = choreSchema.safeParse(chore);
  for (const issue of result.error?.issues ?? []) {
    const field = issue.path[0] as keyof ChoreInput;
    errors[field] ??= issue.message;
  }
  return errors;
}
