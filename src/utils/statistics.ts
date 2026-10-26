import { isPausedOn, PauseSummary, toDateString } from "../data/pauses";
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

/** Förra veckan: måndag till och med söndag veckan innan (#42). */
export function lastWeek(today: Date = new Date()): Period {
  const end = currentWeek(today).start;
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { label: "förra veckan", start, end };
}

/** Förra månaden: hela kalendermånaden innan den nuvarande (#43). */
export function lastMonth(today: Date = new Date()): Period {
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);
  return { label: "förra månaden", start, end };
}

/** Perioderna som har gjorda sysslor, i ordningen pilarna går (#44). */
export function periodsWithStatistics(completions: Completion[], today: Date = new Date()): Period[] {
  return [currentWeek(today), lastWeek(today), lastMonth(today)].filter((period) =>
    completions.some((c) => inPeriod(c, period)),
  );
}

/** Sysslor som gjordes en dag då medlemmen var pausad räknas inte (#20). */
export function withoutPausedDays(completions: Completion[], pauses: PauseSummary[]): Completion[] {
  return completions.filter((completion) => {
    const day = toDateString(completion.createdAt);
    return !pauses.some((pause) => pause.userId === completion.userId && isPausedOn(pause, day));
  });
}

export function daysIn(period: Period): string[] {
  const days: string[] = [];
  const day = new Date(period.start);
  while (day < period.end) {
    days.push(toDateString(day));
    day.setDate(day.getDate() + 1);
  }
  return days;
}

export function activeDays(userId: string, period: Period, pauses: PauseSummary[]): number {
  return daysIn(period).filter(
    (day) => !pauses.some((pause) => pause.userId === userId && isPausedOn(pause, day)),
  ).length;
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
  pauses: PauseSummary[],
) {
  const inside = completions.filter((c) => inPeriod(c, period));
  const weightOf = new Map(chores.map((c) => [c.id, c.weight]));
  const periodDays = daysIn(period).length;

  function normalized(totals: Map<string, number>): Map<string, number> {
    return new Map(
      [...totals].map(([userId, value]) => {
        const active = activeDays(userId, period, pauses);
        return [userId, active === 0 ? 0 : (value * periodDays) / active];
      }),
    );
  }

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
      return { chore, slices: slices(normalized(counts), members) };
    })
    .filter((c) => c.slices.length > 0);

  return { total: slices(normalized(total), members), perChore };
}
