import { ChoreGroup, Member } from "../data/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  const days = Math.floor((today.getTime() - group.startDate.getTime()) / MS_PER_DAY);
  const turn = Math.floor(Math.max(days, 0) / group.rotationDays);
  return members[turn % members.length];
}

/** Hur många dagar till gruppen roterar till nästa person. */
export function daysUntilRotation(group: ChoreGroup, today: Date = new Date()): number {
  const days = Math.floor((today.getTime() - group.startDate.getTime()) / MS_PER_DAY);
  return group.rotationDays - (Math.max(days, 0) % group.rotationDays);
}
