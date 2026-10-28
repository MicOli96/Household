import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { daysSinceDone, isOverdue } from "../src/utils/chores.ts";

// Nu är onsdag 28 oktober 2026 kl. 08.
beforeEach(() => mock.timers.enable({ apis: ["Date"], now: new Date(2026, 9, 28, 8) }));
afterEach(() => mock.timers.reset());

const chore = (lastDoneAt, intervalDays = 1) => ({ id: "c", intervalDays, lastDoneAt });

test("en syssla som aldrig gjorts har inga dagar och är försenad", () => {
  assert.equal(daysSinceDone(chore(null)), null);
  assert.equal(isOverdue(chore(null)), true);
});

test("gjord tidigare idag är noll dagar sedan", () => {
  assert.equal(daysSinceDone(chore(new Date(2026, 9, 28, 7))), 0);
});

test("gjord i går kväll är en dag sedan, inte idag", () => {
  assert.equal(daysSinceDone(chore(new Date(2026, 9, 27, 22))), 1);
});

test("dagarna räknas i kalenderdagar oavsett klockslag", () => {
  assert.equal(daysSinceDone(chore(new Date(2026, 9, 26, 9))), 2);
  assert.equal(daysSinceDone(chore(new Date(2026, 9, 26, 0, 5))), 2);
});

test("försenad när fler kalenderdagar än intervallet har gått", () => {
  // En daglig syssla som gjordes i förrgår missades i går.
  assert.equal(isOverdue(chore(new Date(2026, 9, 26, 9), 1)), true);
  assert.equal(isOverdue(chore(new Date(2026, 9, 27, 23), 1)), false);
  assert.equal(isOverdue(chore(new Date(2026, 9, 21, 7), 7)), false);
  assert.equal(isOverdue(chore(new Date(2026, 9, 20, 23), 7)), true);
});

test("sommartiden ändrar inte antalet dagar", () => {
  // 29 mars 2026 har bara 23 timmar i svensk tid. Räknat i timmar var det
  // här 0 dagar. Testet säger något bara när det körs med svensk tidszon.
  mock.timers.setTime(new Date(2026, 2, 30, 0, 15).getTime());
  assert.equal(daysSinceDone(chore(new Date(2026, 2, 29, 0, 30))), 1);
});
