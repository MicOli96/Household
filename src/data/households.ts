import { requireUser, supabase } from "../lib/supabase";
import { avatars, type AvatarEmoji } from "../theme/avatars";
import { validateName } from "./profile";
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

export async function getMyProfile(householdId: string): Promise<MyProfile> {
  const { id: userId } = await requireUser();

  const profileQuery = supabase.from("household_members")
    .select("name, avatar_id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  const takenQuery = supabase.from("household_members")
    .select("user_id, avatar_id")
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
    .filter((row) => row.user_id !== userId)
    .map((row) => toAvatar(Number(row.avatar_id)))
    .filter((emoji): emoji is AvatarEmoji => emoji !== null);

  return { name, avatar, taken };
}

export async function saveMyProfile(
  householdId: string,
  name: string,
  avatar: AvatarEmoji | null,
): Promise<void> {
  const nameError = validateName(name);
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

// Provar ett nytt slumpat djur om någon annan hann ta det först.
export async function saveNewMemberProfile(householdId: string, name: string): Promise<void> {
  const nameError = validateName(name);
  if (nameError) throw new Error(nameError);

  const { taken } = await getMyProfile(householdId);
  const free = avatarEmojis.filter((emoji) => !taken.includes(emoji));
  while (free.length > 0) {
    const [avatar] = free.splice(Math.floor(Math.random() * free.length), 1);
    try {
      await saveMyProfile(householdId, name, avatar);
      return;
    } catch (reason) {
      if (!(reason instanceof Error && reason.message.startsWith("Den avataren"))) throw reason;
    }
  }

  const { id: userId } = await requireUser();
  const { error } = await supabase.from("household_members")
    .update({ name: name.trim() })
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .is("deleted_at", null);
  if (error) throw new Error("Kunde inte spara ditt namn i hushållet. Ändra det i profilen.");
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

// Godkänner en förfrågan så att personen blir medlem (#18). Databasen släpper
// bara igenom ägare: för andra ändras ingen rad, och då kommer inget tillbaka.
// Bara obesvarade förfrågningar ändras, så två ägare kan inte svara samtidigt.
export async function approveRequest(householdId: string, userId: string): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.from("household_members")
    .update({ is_approved: true })
    .eq("household_id", householdId).eq("user_id", userId)
    .eq("is_approved", false).is("deleted_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) throw new Error("Kunde inte godkänna förfrågan. Den kan redan vara besvarad.");
}

// Nekar en förfrågan (#18). Raden tas bort genom att deleted_at sätts, och
// den som frågade ser "Förfrågan nekades". Personen kan fråga igen med koden.
export async function denyRequest(householdId: string, userId: string): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.from("household_members")
    .update({ deleted_at: new Date().toISOString() })
    .eq("household_id", householdId).eq("user_id", userId)
    .eq("is_approved", false).is("deleted_at", null)
    .select("user_id").maybeSingle();
  if (error || !data) throw new Error("Kunde inte neka förfrågan. Den kan redan vara besvarad.");
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
  return error instanceof Error && /^(Du måste|Du är redan|Kunde inte|Hushållet|Skapandet|Ange ett|Ange en|Namnet|Välj en|Den avataren|Välj ett)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
