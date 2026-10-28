import type { Chore } from "../data/types";
import { calendarDaysBetween } from "./dates";

/** Antal kalenderdagar sedan sysslan gjordes, eller null om den aldrig gjorts. */
export function daysSinceDone(chore: Chore): number | null {
  if (!chore.lastDoneAt) return null;
  return calendarDaysBetween(chore.lastDoneAt, new Date());
}

/**
 * Är sysslan försenad? Det är den när det gått fler dagar än intervalDays
 * sedan den gjordes senast, eller om den aldrig har gjorts.
 */
export function isOverdue(chore: Chore): boolean {
  const days = daysSinceDone(chore);
  if (days === null) return true;
  return days > chore.intervalDays;
}
