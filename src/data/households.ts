import { avatars, type AvatarEmoji } from "../theme/avatars";
import { requireUser, supabase } from "../lib/supabase";
import type { Household, Member } from "./types";

export type HouseholdSummary = Pick<Household, "id" | "name" | "code">;

/** En medlem som hushållsvyn visar den. Avataren saknas tills medlemmen har valt en. */
export type MemberSummary = Pick<Member, "userId" | "name" | "isOwner" | "isApproved"> & {
  avatar: AvatarEmoji | null;
  /** Om det är den inloggade användaren. */
  isMe: boolean;
};

export type MyProfile = {
  name: string;
  avatar: AvatarEmoji | null;
  taken: AvatarEmoji[];
};

const avatarEmojis = Object.keys(avatars) as AvatarEmoji[];
const avatarIdByEmoji = Object.fromEntries(
  avatarEmojis.map((emoji, index) => [emoji, index + 1]),
) as Record<AvatarEmoji, number>;

function toAvatar(avatarId: number | null | undefined): AvatarEmoji | null {
  if (!avatarId) return null;
  return avatarEmojis[avatarId - 1] ?? null;
}

export function validateHouseholdName(value: string): string {
  if (!value.trim()) return "Ange ett namn för hushållet.";
  if (value.trim().length > 100) return "Namnet får innehålla högst 100 tecken.";
  return "";
}

export function validateProfileName(value: string): string {
  if (!value.trim()) return "Ange ett namn för profilen.";
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

export async function listHouseholds(): Promise<HouseholdSummary[]> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("households")
    .select("id, name, code, household_members!inner(user_id)")
    .eq("household_members.user_id", userId)
    .eq("household_members.is_approved", true)
    .is("household_members.deleted_at", null)
    .is("deleted_at", null)
    .order("created_at");
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
    .select("id, name, code")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new Error("Hushållet kunde inte öppnas. Det kanske inte finns eller så saknar du åtkomst.");
  return data;
}

export async function getMyProfile(householdId: string): Promise<MyProfile> {
  const { id: userId } = await requireUser();

  const profileQuery = supabase.from("household_members")
    .select("name, avatar_id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  const takenQuery = supabase.from("household_members")
    .select("avatar_id")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .not("avatar_id", "is", null);

  const [profileResult, takenResult] = await Promise.all([profileQuery, takenQuery]);

  if (profileResult.error && profileResult.error.code !== "PGRST116") {
    throw new Error("Kunde inte hämta din profil. Försök igen.");
  }
  if (takenResult.error) {
    throw new Error("Kunde inte hämta valda avatarer. Försök igen.");
  }

  if (!profileResult.data) {
    throw new Error("Kunde inte hitta din profil i hushållet. Kontrollera att du är medlem.");
  }

  const name = profileResult.data.name;
  const avatar = toAvatar(profileResult.data?.avatar_id ?? null);
  const taken = (takenResult.data ?? [])
    .map((row) => toAvatar(Number(row.avatar_id)))
    .filter((emoji): emoji is AvatarEmoji => emoji !== null);

  return { name, avatar, taken };
}

export async function saveMyProfile(
  householdId: string,
  name: string,
  avatar: AvatarEmoji | null,
): Promise<void> {
  const nameError = validateProfileName(name);
  if (nameError) throw new Error(nameError);
  if (!avatar) throw new Error("Välj en avatar.");

  const { id: userId } = await requireUser();
  const avatarId = avatarIdByEmoji[avatar];

  const saveQuery = supabase.from("household_members")
    .update({ name: name.trim(), avatar_id: avatarId })
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("user_id")
    .maybeSingle();
  const saveResult = await saveQuery;

  if (saveResult.error || !saveResult.data) {
    if (!saveResult.error) {
      throw new Error("Kunde inte spara profilen. Kontrollera att du är medlem i hushållet.");
    }
    const message = saveResult.error.message ?? "";
    if (/duplicate|unique/i.test(message)) {
      throw new Error("Den avataren är redan vald av någon annan i hushållet.");
    }
    throw new Error("Kunde inte spara profilen. Försök igen.");
  }
}

// Byter namn på hushållet. Databasen släpper bara igenom ägare: för andra
// ändras ingen rad, och då kommer inget hushåll tillbaka.
export async function renameHousehold(id: string, name: string): Promise<HouseholdSummary> {
  const validation = validateHouseholdName(name);
  if (validation) throw new Error(validation);
  await requireUser();
  const { data, error } = await supabase.from("households")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("id, name, code")
    .maybeSingle();
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
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();
  if (error || !data) throw new Error("Kunde inte ändra ägarrollen. Bara ägare kan utse ägare.");
}

// Medlemmar och förfrågningar (is_approved = false) som inte har lämnat, äldst först.
export async function getMembers(householdId: string): Promise<MemberSummary[]> {
  const { id: userId } = await requireUser();
  const { data, error } = await supabase.from("household_members")
    .select("user_id, name, is_owner, is_approved, avatar_id")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("created_at");
  if (error) throw new Error("Kunde inte hämta medlemmarna. Försök igen.");
  return (data ?? []).map((row) => ({
    userId: row.user_id,
    name: row.name,
    isOwner: row.is_owner,
    isApproved: row.is_approved,
    avatar: toAvatar(row.avatar_id),
    isMe: row.user_id === userId,
  }));
}

export function householdError(error: unknown): string {
  // Importfel och tekniska fel ska inte visa konfigurationsdetaljer i gränssnittet.
  return error instanceof Error && /^(Du måste|Kunde inte|Hushållet|Skapandet|Ange ett|Namnet|Välj en)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
