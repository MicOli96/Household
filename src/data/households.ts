import { requireUser, supabase } from "../lib/supabase";
import type { AvatarEmoji } from "../theme/avatars";
import type { Household, Member } from "./types";

export type HouseholdSummary = Pick<Household, "id" | "name" | "code">;

/** En medlem som hushållsvyn visar den. Avataren saknas tills medlemmen har valt en. */
export type MemberSummary = Pick<Member, "userId" | "name" | "isOwner" | "isApproved"> & {
  avatar: AvatarEmoji | null;
  /** Om det är den inloggade användaren. */
  isMe: boolean;
};

export function validateHouseholdName(value: string): string {
  if (!value.trim()) return "Ange ett namn för hushållet.";
  if (value.trim().length > 100) return "Namnet får innehålla högst 100 tecken.";
  return "";
}

export async function createHousehold(name: string): Promise<HouseholdSummary> {
  const validation = validateHouseholdName(name);
  if (validation) throw new Error(validation);
  await requireUser();
  const { data, error } = await supabase.rpc("create_household", { p_name: name.trim() });
  if (error) throw new Error("Kunde inte skapa hushållet. Försök igen.");
  if (!data?.id) throw new Error("Skapandet kunde inte bekräftas. Uppdatera hushållslistan innan du försöker igen.");
  return { id: data.id, name: data.name, code: data.code };
}

export function householdCode(value: string): string {
  return value.trim().toUpperCase();
}

export function validateHouseholdCode(value: string): string {
  const code = householdCode(value);
  if (!code) return "Ange en hushållskod.";
  if (!/^[A-Z0-9]{1,10}$/.test(code)) {
    return "Ange en kod med högst 10 bokstäver eller siffror.";
  }
  return "";
}

export async function joinHousehold(value: string): Promise<string> {
  const validation = validateHouseholdCode(value);
  if (validation) throw new Error(validation);

  await requireUser();
  const { data, error } = await supabase.rpc("join_household", {
    p_code: householdCode(value),
  });

  if (error) {
    if (error.message.startsWith("Det finns inget hushåll med koden")) {
      throw new Error("Hushållet kunde inte hittas. Kontrollera koden.");
    }
    if (error.message === "Du är redan med i hushållet eller väntar på svar") {
      throw new Error("Du är redan med i hushållet eller väntar på svar. Kontrollera Mina hushåll.");
    }
    throw new Error("Kunde inte skicka förfrågan. Försök igen.");
  }

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("Kunde inte bekräfta förfrågan. Kontrollera Mina hushåll innan du försöker igen.");
  }

  return data;
}

export async function listHouseholds(): Promise<HouseholdSummary[]> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("households")
    .select("id, name, code, household_members!inner(user_id)")
    .eq("household_members.user_id", userId)
    .eq("household_members.is_approved", true)
    .is("household_members.deleted_at", null)
    .is("deleted_at", null).order("created_at");
  if (error) throw new Error("Kunde inte hämta hushållen. Försök igen.");
  return (data ?? []).map(({ id, name, code }) => ({ id, name, code }));
}

// Hushåll där den inloggade har skickat en förfrågan som ägaren inte har svarat på ännu (#25).
export async function listPendingHouseholds(): Promise<HouseholdSummary[]> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("households")
    .select("id, name, code, household_members!inner(user_id)")
    .eq("household_members.user_id", userId)
    .eq("household_members.is_approved", false)
    .is("household_members.deleted_at", null)
    .is("deleted_at", null).order("created_at");
  if (error) throw new Error("Kunde inte hämta förfrågningarna. Försök igen.");
  return (data ?? []).map(({ id, name, code }) => ({ id, name, code }));
}

/**
 * Var den inloggade förfrågan till ett hushåll står.
 * "denied" betyder att raden är borttagen eller saknas, t.ex. för att ägaren nekade.
 */
export type MembershipStatus = "approved" | "pending" | "denied";

export async function getMembershipStatus(householdId: string): Promise<MembershipStatus> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("household_members")
    .select("is_approved, deleted_at")
    .eq("household_id", householdId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Kunde inte hämta förfrågan. Försök igen.");
  if (!data || data.deleted_at) return "denied";
  return data.is_approved ? "approved" : "pending";
}

export async function getHousehold(id: string): Promise<HouseholdSummary> {
  await requireUser();
  const { data, error } = await supabase.from("households")
    .select("id, name, code").eq("id", id).is("deleted_at", null).single();
  if (error || !data) throw new Error("Hushållet kunde inte öppnas. Det kanske inte finns eller så saknar du åtkomst.");
  return data;
}

// Byter namn på hushållet. Databasen släpper bara igenom ägare: för andra
// ändras ingen rad, och då kommer inget hushåll tillbaka.
export async function renameHousehold(id: string, name: string): Promise<HouseholdSummary> {
  const validation = validateHouseholdName(name);
  if (validation) throw new Error(validation);
  await requireUser();
  const { data, error } = await supabase.from("households")
    .update({ name: name.trim() }).eq("id", id)
    .select("id, name, code").maybeSingle();
  if (error || !data) throw new Error("Kunde inte byta namn. Bara ägare kan byta namn på hushållet.");
  return data;
}

// Gör en medlem till ägare eller tar bort ägarrollen (#19). Databasen släpper
// bara igenom ägare: för andra ändras ingen rad, och då kommer inget tillbaka.
export async function setMemberOwner(
  householdId: string,
  userId: string,
  isOwner: boolean,
): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.from("household_members")
    .update({ is_owner: isOwner })
    .eq("household_id", householdId).eq("user_id", userId)
    .select("user_id").maybeSingle();
  if (error || !data) throw new Error("Kunde inte ändra ägarrollen. Bara ägare kan utse ägare.");
}

// Medlemmar och förfrågningar (is_approved = false) som inte har lämnat, äldst först.
export async function getMembers(householdId: string): Promise<MemberSummary[]> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("household_members")
    .select("user_id, name, is_owner, is_approved, avatars(emoji)")
    .eq("household_id", householdId)
    .is("deleted_at", null).order("created_at");
  if (error) throw new Error("Kunde inte hämta medlemmarna. Försök igen.");
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    isOwner: row.is_owner,
    isApproved: row.is_approved,
    avatar: (row.avatars as unknown as { emoji: AvatarEmoji } | null)?.emoji ?? null,
    isMe: row.user_id === userId,
  }));
}

export function householdError(error: unknown): string {
  // Importfel och tekniska fel ska inte visa konfigurationsdetaljer i gränssnittet.
  return error instanceof Error && /^(Du måste|Du är redan|Kunde inte|Hushållet|Skapandet|Ange ett|Ange en|Namnet)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
