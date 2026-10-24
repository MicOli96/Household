import type { Completion, Member } from "../data/types";

/** En person per userId, även om samma syssla registrerats flera gånger. */
export function completionMembers(completions: Completion[], members: Member[]): Member[] {
  const byId = new Map(members.map((member) => [member.userId, member]));
  return [...new Set(completions.filter((row) => row.deletedAt === null).map((row) => row.userId))]
    .map((id) => byId.get(id))
    .filter((member): member is Member => member !== undefined);
}

/** Lokala kalenderdagar, inte en rullande 24-timmarsperiod. */
export function sameCompletionDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
