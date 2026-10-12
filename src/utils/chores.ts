import { Chore } from "../data/mockChores";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Antal hela dagar sedan sysslan gjordes, eller null om den aldrig gjorts. */
export function daysSinceDone(chore: Chore): number | null {
  if (!chore.lastDoneAt) return null;
  return Math.floor((Date.now() - chore.lastDoneAt.getTime()) / MS_PER_DAY);
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
