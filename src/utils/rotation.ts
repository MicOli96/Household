import type { ChoreGroup, Member } from "../data/types";
import { calendarDaysBetween } from "./dates";

/**
 * Vem har rotationsgruppen idag? Gruppen går runt i medlemslistans ordning
 * och byter person var rotationDays:e dag, räknat från startDate.
 */
export function currentRotationMember(
  group: ChoreGroup,
  members: Member[],
  today: Date = new Date(),
): Member | null {
  if (members.length === 0) return null;
  const days = calendarDaysBetween(group.startDate, today);
  const turn = Math.floor(Math.max(days, 0) / group.rotationDays);
  return members[turn % members.length];
}

/** Hur många dagar till gruppen roterar till nästa person. */
export function daysUntilRotation(group: ChoreGroup, today: Date = new Date()): number {
  const days = calendarDaysBetween(group.startDate, today);
  return group.rotationDays - (Math.max(days, 0) % group.rotationDays);
}
