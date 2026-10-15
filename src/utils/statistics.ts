import { ChoreRow, Completion, Member } from "../data/types";

export type Period = {
  label: string;
  start: Date;
  /** Exklusivt slut, alltså första ögonblicket som inte räknas. */
  end: Date;
};

/** Nuvarande vecka: från måndag 00:00 till och med idag (#41). */
export function currentWeek(today: Date = new Date()): Period {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  // getDay(): söndag = 0, måndag = 1. Veckan börjar på måndag.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(today);
  end.setHours(24, 0, 0, 0);
  return { label: "nuvarande vecka", start, end };
}

export type Slice = { member: Member; value: number };

function inPeriod(completion: Completion, period: Period) {
  return completion.createdAt >= period.start && completion.createdAt < period.end;
}

function slices(totals: Map<string, number>, members: Member[]): Slice[] {
  return members
    .map((member) => ({ member, value: totals.get(member.userId) ?? 0 }))
    .filter((s) => s.value > 0);
}

/**
 * Fördelningen mellan medlemmarna under en period (#39, #40).
 * total räknar varje gjord syssla med sin vikt, perChore räknar antal gånger.
 */
export function distribution(
  completions: Completion[],
  chores: ChoreRow[],
  members: Member[],
  period: Period,
) {
  const inside = completions.filter((c) => inPeriod(c, period));
  const weightOf = new Map(chores.map((c) => [c.id, c.weight]));

  const total = new Map<string, number>();
  for (const c of inside) {
    total.set(c.userId, (total.get(c.userId) ?? 0) + (weightOf.get(c.choreId) ?? 0));
  }

  const perChore = chores
    .map((chore) => {
      const counts = new Map<string, number>();
      for (const c of inside.filter((c) => c.choreId === chore.id)) {
        counts.set(c.userId, (counts.get(c.userId) ?? 0) + 1);
      }
      return { chore, slices: slices(counts, members) };
    })
    .filter((c) => c.slices.length > 0);

  return { total: slices(total, members), perChore };
}
