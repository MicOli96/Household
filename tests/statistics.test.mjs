import assert from "node:assert/strict";
import test from "node:test";
import {
  activeDays,
  currentWeek,
  daysIn,
  distribution,
  lastMonth,
  lastWeek,
  periodsWithStatistics,
  withoutPausedDays,
} from "../src/utils/statistics.ts";

// Onsdag 28 oktober 2026 kl. 15.
const today = new Date(2026, 9, 28, 15);
const anna = { userId: "a", name: "Anna", avatar: "🦊" };
const bo = { userId: "b", name: "Bo", avatar: "🐸" };
const dishes = { id: "dishes", name: "Disk", weight: 2 };
const floor = { id: "floor", name: "Golv", weight: 8 };
const done = (userId, choreId, date) => ({ userId, choreId, createdAt: date, deletedAt: null });
const pause = (userId, startDate, endDate) => ({ id: `${userId}-${startDate}`, userId, startDate, endDate });

test("nuvarande vecka går från måndag till och med idag", () => {
  const week = currentWeek(today);
  assert.deepEqual(week.start, new Date(2026, 9, 26));
  assert.deepEqual(week.end, new Date(2026, 9, 29));
});

test("på en söndag börjar veckan måndagen innan", () => {
  assert.deepEqual(currentWeek(new Date(2026, 10, 1, 12)).start, new Date(2026, 9, 26));
});

test("förra veckan är hela veckan före den nuvarande", () => {
  const week = lastWeek(today);
  assert.deepEqual(week.start, new Date(2026, 9, 19));
  assert.deepEqual(week.end, new Date(2026, 9, 26));
  assert.equal(daysIn(week).length, 7);
});

test("förra månaden är hela kalendermånaden, även över årsskiftet", () => {
  const october = lastMonth(today);
  assert.deepEqual(october.start, new Date(2026, 8, 1));
  assert.deepEqual(october.end, new Date(2026, 9, 1));
  assert.deepEqual(lastMonth(new Date(2027, 0, 10)).start, new Date(2026, 11, 1));
});

test("bara perioder med gjorda sysslor visas", () => {
  const onlyInSeptember = [done("a", "dishes", new Date(2026, 8, 15))];
  assert.deepEqual(periodsWithStatistics(onlyInSeptember, today).map((p) => p.label), ["förra månaden"]);
  assert.deepEqual(periodsWithStatistics([], today), []);
});

test("sysslor som gjordes en pausad dag räknas inte, men bara för den som var pausad", () => {
  const rows = [done("a", "dishes", new Date(2026, 9, 20, 9)), done("b", "dishes", new Date(2026, 9, 20, 9))];
  const left = withoutPausedDays(rows, [pause("a", "2026-10-20", "2026-10-20")]);
  assert.deepEqual(left.map((c) => c.userId), ["b"]);
});

test("en paus utan slutdatum gäller alla dagar från starten", () => {
  assert.equal(activeDays("a", lastWeek(today), [pause("a", "2026-10-22", null)]), 3);
});

test("totalt räknas med vikt och perChore räknar antal gånger", () => {
  const rows = [
    done("a", "dishes", new Date(2026, 9, 20)),
    done("a", "dishes", new Date(2026, 9, 21)),
    done("b", "floor", new Date(2026, 9, 21)),
  ];
  const { total, perChore } = distribution(rows, [dishes, floor], [anna, bo], lastWeek(today), []);
  assert.deepEqual(total.map((s) => [s.member.userId, s.value]), [["a", 4], ["b", 8]]);
  assert.deepEqual(
    perChore.map((c) => [c.chore.id, c.slices.map((s) => [s.member.userId, s.value])]),
    [["dishes", [["a", 2]]], ["floor", [["b", 1]]]],
  );
});

test("den som varit pausad räknas upp efter hur många dagar hen var med", () => {
  // Anna är pausad 4 av veckans 7 dagar och med 3, så hennes poäng räknas upp 7/3.
  const rows = [done("a", "dishes", new Date(2026, 9, 19)), done("b", "dishes", new Date(2026, 9, 19))];
  const pauses = [pause("a", "2026-10-22", "2026-10-25")];
  const { total } = distribution(rows, [dishes], [anna, bo], lastWeek(today), pauses);
  assert.deepEqual(total.map((s) => [s.member.userId, s.value]), [["a", (2 * 7) / 3], ["b", 2]]);
});

test("medlemmar utan gjorda sysslor och borttagna sysslor ger inga bitar", () => {
  const rows = [done("a", "removed", new Date(2026, 9, 20))];
  assert.deepEqual(distribution(rows, [dishes], [anna, bo], lastWeek(today), []).total, []);
});
