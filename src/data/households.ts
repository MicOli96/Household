import type { Household } from "./types";

export type HouseholdSummary = Pick<Household, "id" | "name" | "code">;

export function validateHouseholdName(value: string): string {
  if (!value.trim()) return "Ange ett namn för hushållet.";
  if (value.trim().length > 100) return "Namnet får innehålla högst 100 tecken.";
  return "";
}

async function client() {
  const { supabase } = await import("../lib/supabase");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Du måste vara inloggad. Öppna Logga in och försök igen.");
  return { supabase, userId: data.user.id };
}

export async function createHousehold(name: string): Promise<HouseholdSummary> {
  const validation = validateHouseholdName(name);
  if (validation) throw new Error(validation);
  const { supabase } = await client();
  const { data, error } = await supabase.rpc("create_household", { p_name: name.trim() });
  if (error) throw new Error("Kunde inte skapa hushållet. Försök igen.");
  if (!data?.id) throw new Error("Skapandet kunde inte bekräftas. Uppdatera hushållslistan innan du försöker igen.");
  return { id: data.id, name: data.name, code: data.code };
}

export async function listHouseholds(): Promise<HouseholdSummary[]> {
  const { supabase, userId } = await client();
  const { data, error } = await supabase.from("households")
    .select("id, name, code, household_members!inner(user_id)")
    .eq("household_members.user_id", userId)
    .eq("household_members.is_approved", true)
    .is("household_members.deleted_at", null)
    .is("deleted_at", null).order("created_at");
  if (error) throw new Error("Kunde inte hämta hushållen. Försök igen.");
  return (data ?? []).map(({ id, name, code }) => ({ id, name, code }));
}

export async function getHousehold(id: string): Promise<HouseholdSummary> {
  const { supabase } = await client();
  const { data, error } = await supabase.from("households")
    .select("id, name, code").eq("id", id).is("deleted_at", null).single();
  if (error || !data) throw new Error("Hushållet kunde inte öppnas. Det kanske inte finns eller så saknar du åtkomst.");
  return data;
}

export function householdError(error: unknown): string {
  // Importfel och tekniska fel ska inte visa konfigurationsdetaljer i gränssnittet.
  return error instanceof Error && /^(Du måste|Kunde inte|Hushållet|Skapandet|Ange ett|Namnet)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
