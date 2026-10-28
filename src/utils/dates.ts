// Datum i telefonens tid. toISOString och new Date("2026-10-14") räknar i UTC
// och kan ge fel dag, därför byggs texten och datumen upp för hand.

/** Datumet som "ÅÅÅÅ-MM-DD", samma format som kolumner av typen date. */
export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-10-14" blir lokal midnatt den dagen. */
export function fromDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Dagens datum plus days dagar, som "ÅÅÅÅ-MM-DD". */
export function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Hur många kalenderdagar det är från from till to i telefonens tid. Från
 * kl. 22 i går till kl. 8 i dag är en dag. Räknas på datumen, så sommartid
 * (dagar med 23 eller 25 timmar) ger inte fel.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / MS_PER_DAY);
}
