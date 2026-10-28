import { UserError } from "../lib/errors";
import { requireUser, supabase } from "../lib/supabase";
import { daysFromToday } from "../utils/dates";

// Pauser för medlemmar (#20). En rad per paus, och end_date = null betyder
// tills vidare. Avslutade pauser ligger kvar, eftersom statistiken behöver
// veta vilka dagar medlemmen var pausad.

/** En paus som pågår eller är planerad. Datumen är "ÅÅÅÅ-MM-DD", som i databasen. */
export type PauseSummary = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string | null;
};

// Pauser som pågår eller är planerade. Statistiken behöver även avslutade.
export async function getPauses(householdId: string, includeEnded = false): Promise<PauseSummary[]> {
  await requireUser();
  let query = supabase.from("pauses")
    .select("id, user_id, start_date, end_date")
    .eq("household_id", householdId)
    .is("deleted_at", null);
  if (!includeEnded) query = query.or(`end_date.is.null,end_date.gte.${daysFromToday(0)}`);
  const { data, error } = await query.order("start_date");
  if (error) throw new UserError("Kunde inte hämta pauserna. Försök igen.");
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
  }));
}

/** endDate = null betyder att pausen gäller tills vidare. */
export async function addPause(
  householdId: string,
  userId: string,
  startDate: string,
  endDate: string | null,
): Promise<void> {
  if (endDate !== null && endDate < startDate) {
    throw new UserError("Slutdatumet kan inte vara före startdatumet.");
  }
  await requireUser();
  const { error } = await supabase.from("pauses")
    .insert({ household_id: householdId, user_id: userId, start_date: startDate, end_date: endDate });
  if (error) throw new UserError("Kunde inte pausa medlemmen. Bara ägare kan pausa medlemmar.");
}

// Pausen slutar igår, så att medlemmen är aktiv redan idag. En paus som
// börjar idag eller senare tas bort, eftersom slutet annars hamnar före starten.
export async function stopPause(pause: PauseSummary): Promise<void> {
  await requireUser();
  const change = pause.startDate >= daysFromToday(0)
    ? { deleted_at: new Date().toISOString() }
    : { end_date: daysFromToday(-1) };
  const { data, error } = await supabase.from("pauses")
    .update(change).eq("id", pause.id)
    .select("id").maybeSingle();
  if (error || !data) throw new UserError("Kunde inte avsluta pausen. Bara ägare kan ändra pauser.");
}
