import { z } from "zod";

// Användarens namn (#27). Namnet sparas på kontot (user_metadata.name), så att
// det finns redan innan man har ett hushåll. create_household och
// join_household kopierar det därifrån till household_members.name, och när
// man byter namn ändras det i hushållen man redan är med i också.

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

async function client() {
  const { supabase } = await import("../lib/supabase");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Du måste vara inloggad. Öppna Logga in och försök igen.");
  return { supabase, user: data.user };
}

/** Namnet som är sparat på kontot, eller en tom sträng om inget är sparat än. */
export async function getMyName(): Promise<string> {
  const { user } = await client();
  const result = nameSchema.safeParse(user.user_metadata?.name);
  return result.success ? result.data : "";
}

/** Sparar namnet och returnerar det som det sparades (utan mellanslag runt). */
export async function saveMyName(value: string): Promise<string> {
  const result = nameSchema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  const name = result.data;

  const { supabase, user } = await client();
  const { error } = await supabase.auth.updateUser({ data: { name } });
  if (error) throw new Error("Kunde inte spara namnet. Försök igen.");

  // Hushållen visar namnet från household_members. Även väntande förfrågningar
  // ändras, så att ägaren ser det nya namnet.
  const { error: memberError } = await supabase.from("household_members")
    .update({ name })
    .eq("user_id", user.id)
    .is("deleted_at", null);
  if (memberError) throw new Error("Kunde inte ändra namnet i dina hushåll. Försök igen.");

  return name;
}

export function profileError(error: unknown): string {
  // Tekniska fel ska inte visa konfigurationsdetaljer i gränssnittet.
  return error instanceof Error && /^(Du måste|Kunde inte|Ange ditt|Namnet)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
