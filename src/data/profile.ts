import { z } from "zod";
import { requireUser, supabase } from "../lib/supabase";

// Användarens namn (#27). Namnet hör till hushållet och sparas i
// household_members.name (#106). Det senaste namnet sparas även på kontot
// (user_metadata.name) och föreslås när man går med i ett nytt hushåll.

export const NAME_MAX_LENGTH = 100;

/** Samma gränser som household_members.name: varchar(100), inte tomt. */
export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Ange ditt namn." })
  .max(NAME_MAX_LENGTH, { error: `Namnet får innehålla högst ${NAME_MAX_LENGTH} tecken.` });

/** Returnerar felmeddelandet, eller en tom sträng om namnet är godkänt. */
export function validateName(value: string): string {
  const result = nameSchema.safeParse(value);
  return result.success ? "" : result.error.issues[0].message;
}

/** Namnet som är sparat på kontot, eller en tom sträng om inget är sparat än. */
export async function getMyName(): Promise<string> {
  const user = await requireUser();
  const result = nameSchema.safeParse(user.user_metadata?.name);
  return result.success ? result.data : "";
}

/** Sparar namnet på kontot och returnerar det som det sparades (utan mellanslag runt). */
export async function saveMyName(value: string): Promise<string> {
  const validation = validateName(value);
  if (validation) throw new Error(validation);
  // Samma som nameSchema gör innan namnet kontrolleras.
  const name = value.trim();

  await requireUser();
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) throw new Error("Kunde inte spara namnet. Försök igen.");

  return name;
}

export function profileError(error: unknown): string {
  // Tekniska fel ska inte visa konfigurationsdetaljer i gränssnittet.
  return error instanceof Error && /^(Du måste|Kunde inte|Ange ditt|Namnet)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
