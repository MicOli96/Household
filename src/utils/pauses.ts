import type { PauseSummary } from "../data/pauses";
import { daysFromToday } from "./dates";

// Datumen kan jämföras som text eftersom året står först.
export function isPausedOn(pause: PauseSummary, day: string): boolean {
  return pause.startDate <= day && (pause.endDate === null || pause.endDate >= day);
}

export function isPausedToday(pause: PauseSummary): boolean {
  return isPausedOn(pause, daysFromToday(0));
}
