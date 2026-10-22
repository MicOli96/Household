import { requireUser, supabase } from "../lib/supabase";

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

/** Datumet i telefonens tid. toISOString räknar i UTC och kan ge fel dag. */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// Datumen kan jämföras som text eftersom året står först.
export function isPausedOn(pause: PauseSummary, day: string): boolean {
  return pause.startDate <= day && (pause.endDate === null || pause.endDate >= day);
}

export function isPausedToday(pause: PauseSummary): boolean {
  return isPausedOn(pause, daysFromToday(0));
}

// Pauser som pågår eller är planerade. Statistiken behöver även avslutade.
export async function getPauses(householdId: string, includeEnded = false): Promise<PauseSummary[]> {
  await requireUser();
  let query = supabase.from("pauses")
    .select("id, user_id, start_date, end_date")
    .eq("household_id", householdId)
    .is("deleted_at", null);
  if (!includeEnded) query = query.or(`end_date.is.null,end_date.gte.${daysFromToday(0)}`);
  const { data, error } = await query.order("start_date");
  if (error) throw new Error("Kunde inte hämta pauserna. Försök igen.");
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
    throw new Error("Slutdatumet kan inte vara före startdatumet.");
  }
  await requireUser();
  const { error } = await supabase.from("pauses")
    .insert({ household_id: householdId, user_id: userId, start_date: startDate, end_date: endDate });
  if (error) throw new Error("Kunde inte pausa medlemmen. Bara ägare kan pausa medlemmar.");
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
  if (error || !data) throw new Error("Kunde inte avsluta pausen. Bara ägare kan ändra pauser.");
}

export function pauseError(error: unknown): string {
  return error instanceof Error && /^(Du måste|Kunde inte|Slutdatumet)/.test(error.message)
    ? error.message : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
