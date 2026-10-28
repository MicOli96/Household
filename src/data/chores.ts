import { UserError } from "../lib/errors";
import { requireUser, supabase } from "../lib/supabase";
import { avatars, AvatarEmoji } from "../theme/avatars";
import { validateChore } from "../utils/choreValidation";
import { fromDateString } from "../utils/dates";
import type { Assignment, ChoreGroup, ChoreRow, Completion, Member } from "./types";

// Läser och sparar dagsvyns data i Supabase: medlemmar, sysslor,
// rotationsgrupper, tilldelningar och gjorda sysslor (#11, #12, #13, #14).
// Inget raderas, borttaget får deleted_at och filtreras bort här.

export type HouseholdRows = {
  userId: string;
  members: Member[];
  choreRows: ChoreRow[];
  groups: ChoreGroup[];
  assignments: Assignment[];
  completions: Completion[];
};

// avatars.id 1–8 är samma ordning som i src/theme/avatars.ts.
const avatarEmojis = Object.keys(avatars) as AvatarEmoji[];

type TimestampColumns = { created_at: string; updated_at: string; deleted_at: string | null };

function timestamps(row: TimestampColumns) {
  return {
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

export async function fetchHouseholdRows(householdId: string): Promise<HouseholdRows> {
  const { id: userId } = await requireUser();
  const [members, chores, groups, assignments, completions] = await Promise.all([
    supabase.from("household_members").select("*")
      // Historiska utföranden behöver även avatarer från medlemmar som lämnat.
      // HouseholdData filtrerar fortfarande aktiva medlemmar för tilldelningar.
      .eq("household_id", householdId).eq("is_approved", true)
      .order("created_at"),
    supabase.from("chores").select("*")
      .eq("household_id", householdId).is("deleted_at", null)
      .order("created_at"),
    supabase.from("chore_groups").select("*")
      .eq("household_id", householdId).is("deleted_at", null).order("created_at"),
    supabase.from("chore_assignments").select("*, chores!inner(household_id)")
      .eq("chores.household_id", householdId).is("deleted_at", null),
    supabase.from("completions").select("*, chores!inner(household_id)")
      .eq("chores.household_id", householdId).is("deleted_at", null),
  ]);
  if (members.error || chores.error || groups.error || assignments.error || completions.error) {
    throw new UserError("Kunde inte hämta sysslorna. Försök igen.");
  }

  return {
    userId,
    members: members.data.map((m) => ({
      userId: m.user_id,
      householdId: m.household_id,
      name: m.name,
      avatar: m.avatar_id ? (avatarEmojis[m.avatar_id - 1] ?? null) : null,
      isOwner: m.is_owner,
      isApproved: m.is_approved,
      ...timestamps(m),
    })),
    choreRows: chores.data.map((c) => ({
      id: c.id,
      householdId: c.household_id,
      choreGroupId: c.chore_group_id,
      name: c.name,
      description: c.description,
      intervalDays: c.interval_days,
      weight: c.weight,
      imagePath: c.image_path,
      audioPath: c.audio_path,
      isArchived: c.is_archived,
      ...timestamps(c),
    })),
    groups: groups.data.map((g) => ({
      id: g.id,
      householdId: g.household_id,
      name: g.name,
      rotationDays: g.rotation_days,
      startDate: fromDateString(g.start_date),
      ...timestamps(g),
    })),
    assignments: assignments.data.map((a) => ({
      id: a.id,
      userId: a.user_id,
      choreId: a.chore_id,
      ...timestamps(a),
    })),
    completions: completions.data.map((c) => ({
      id: c.id,
      choreId: c.chore_id,
      userId: c.user_id,
      ...timestamps(c),
    })),
  };
}

/** Markerar en syssla som gjord av den inloggade (en rad i completions). */
export async function insertCompletion(choreId: string): Promise<void> {
  const { id: userId } = await requireUser();
  const { error } = await supabase.from("completions").insert({ chore_id: choreId, user_id: userId });
  if (error) throw new UserError("Kunde inte markera sysslan som gjord. Försök igen.");
}

/** Sätter vilka som har sysslan. Borttagna tilldelningar får deleted_at. */
export async function saveAssignees(
  choreId: string,
  current: Assignment[],
  userIds: string[],
): Promise<void> {
  await requireUser();
  const removed = current.filter((a) => a.choreId === choreId && !userIds.includes(a.userId));
  const added = userIds.filter((id) => !current.some((a) => a.choreId === choreId && a.userId === id));

  if (removed.length > 0) {
    const { error } = await supabase.from("chore_assignments")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", removed.map((a) => a.id));
    if (error) throw new UserError("Kunde inte spara tilldelningen. Försök igen.");
  }
  if (added.length > 0) {
    const { error } = await supabase.from("chore_assignments")
      .insert(added.map((userId) => ({ chore_id: choreId, user_id: userId })));
    if (error) throw new UserError("Kunde inte spara tilldelningen. Försök igen.");
  }
}

/** Det som behövs för att skapa en syssla, i appens namn (camelCase). */
export type NewChore = Pick<ChoreRow, "name" | "description" | "intervalDays" | "weight">;

/**
 * Skapar en syssla i hushållet (#28). Värdena skickas som data, aldrig som
 * SQL-text, så SQL-injektion är inte möjlig. Databasen släpper bara igenom
 * ägare och kontrollerar weight (1, 2, 4, 6, 8), interval_days (> 0) och
 * name (max 100 tecken).
 */
export async function insertChore(householdId: string, chore: NewChore): Promise<void> {
  const invalid = Object.values(validateChore(chore))[0];
  if (invalid) throw new UserError(`Kunde inte skapa sysslan. ${invalid}`);
  await requireUser();
  const { error } = await supabase.from("chores").insert({
    household_id: householdId,
    name: chore.name.trim(),
    description: chore.description.trim(),
    interval_days: chore.intervalDays,
    weight: chore.weight,
  });
  if (error) throw new UserError("Kunde inte skapa sysslan. Bara ägare kan lägga till sysslor.");
}

/** Sparar ändringar i en syssla (#34). Databasen släpper bara igenom ägare. */
export async function updateChore(choreId: string, chore: NewChore): Promise<void> {
  if (!chore.name.trim()) throw new UserError("Kunde inte spara sysslan utan titel.");
  if (chore.description.length > 500) throw new UserError("Kunde inte spara sysslan, beskrivningen är för lång.");
  await requireUser();
  const { error } = await supabase.from("chores")
    .update({
      name: chore.name.trim(),
      description: chore.description.trim(),
      interval_days: chore.intervalDays,
      weight: chore.weight,
    })
    .eq("id", choreId);
  if (error) throw new UserError("Kunde inte spara sysslan. Bara ägare kan redigera sysslor.");
}

/** Arkivering behåller sysslan och utförandena för statistiken. */
export async function archiveChore(choreId: string): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.from("chores")
    .update({ is_archived: true }).eq("id", choreId)
    .is("deleted_at", null).select("id").maybeSingle();
  if (error || !data) {
    throw new UserError("Kunde inte arkivera sysslan. Kontrollera att du är ägare och försök igen.");
  }
}

export async function deleteChore(choreId: string): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.rpc("delete_chore", { p_chore_id: choreId });
  if (error) {
    throw new UserError("Kunde inte ta bort sysslan. Kontrollera att du är ägare och försök igen.");
  }
  if (data !== choreId) {
    throw new UserError("Kunde inte bekräfta borttagningen. Uppdatera listan innan du försöker igen.");
  }
}

/** Skapar en rotationsgrupp och flyttar in sysslorna i den. */
export async function insertGroup(
  householdId: string,
  name: string,
  rotationDays: number,
  choreIds: string[],
): Promise<void> {
  await requireUser();
  const { data, error } = await supabase.from("chore_groups")
    .insert({ household_id: householdId, name, rotation_days: rotationDays })
    .select("id").single();
  if (error || !data) throw new UserError("Kunde inte skapa gruppen. Försök igen.");

  const { error: choreError } = await supabase.from("chores")
    .update({ chore_group_id: data.id }).in("id", choreIds);
  if (choreError) throw new UserError("Gruppen skapades men sysslorna kunde inte läggas till. Försök igen.");
}
