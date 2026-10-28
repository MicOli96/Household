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

test("gjord i går kväll räknas i dagens beteende som noll dagar", () => {
  // Räknas i hela 24-timmarsperioder. Steg 1.4 i planen ändrar det till kalenderdagar.
  assert.equal(daysSinceDone(chore(new Date(2026, 9, 27, 22))), 0);
});

test("en daglig syssla från i förrgår morse är i dagens beteende inte försenad", () => {
  // 47 timmar blir 1 dag, som inte är fler än intervallet. Ändras i steg 1.4.
  assert.equal(isOverdue(chore(new Date(2026, 9, 26, 9), 1)), false);
});

test("försenad först när fler dagar än intervallet har gått", () => {
  assert.equal(isOverdue(chore(new Date(2026, 9, 26, 7), 1)), true);
  assert.equal(isOverdue(chore(new Date(2026, 9, 27, 9), 1)), false);
  assert.equal(isOverdue(chore(new Date(2026, 9, 21, 9), 7)), false);
  assert.equal(isOverdue(chore(new Date(2026, 9, 20, 7), 7)), true);
});
