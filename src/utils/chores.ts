import { Chore } from "../data/mockChores";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Antal hela dagar sedan sysslan gjordes, eller null om den aldrig gjorts. */
export function daysSinceDone(chore: Chore): number | null {
  if (!chore.lastDoneAt) return null;
  return Math.floor((Date.now() - chore.lastDoneAt.getTime()) / MS_PER_DAY);
}

/**
 * Är sysslan försenad?
 *
 * TODO (Sebastian, steg 2 i guiden): just nu returnerar funktionen alltid false.
 * En syssla är försenad när det har gått FLER dagar än intervalDays sedan
 * den gjordes senast. En syssla som aldrig gjorts räknas också som försenad.
 * Tips: använd daysSinceDone(chore) ovanför.
 */
export function isOverdue(chore: Chore): boolean {
  return false;
}
