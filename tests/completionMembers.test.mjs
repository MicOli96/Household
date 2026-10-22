import assert from "node:assert/strict";
import test from "node:test";
import { completionMembers, sameCompletionDay } from "../src/utils/completionMembers.ts";

const members = [
  { userId: "a", name: "Anna", avatar: "🦊", deletedAt: null },
  { userId: "b", name: "Bo", avatar: "🦊", deletedAt: null },
  { userId: "c", name: "Chris", avatar: null, deletedAt: null },
  { userId: "d", name: "Dani", avatar: "🐸", deletedAt: new Date() },
];
const completion = (userId, deletedAt = null) => ({ userId, deletedAt });

test("samma användare visas en gång, olika användare med samma avatar bevaras", () => {
  const rows = [completion("a"), completion("a"), completion("b")];
  assert.deepEqual(completionMembers(rows, members).map((m) => m.userId), ["a", "b"]);
  assert.equal(rows.length, 3); // Statistiken behåller alla utföranden.
});
test("medlemmar utan avatar och tidigare medlemmar försvinner inte", () => {
  assert.deepEqual(completionMembers([completion("c"), completion("d")], members).map((m) => m.userId), ["c", "d"]);
});
test("ångrade utföranden och okända användare ger inga avatarer", () => {
  assert.deepEqual(completionMembers([completion("a", new Date()), completion("unknown")], members), []);
  assert.deepEqual(completionMembers([], members), []);
});
test("uppdaterad avatar läses från medlemmen", () => {
  const changed = members.map((m) => ({ ...m, avatar: "🐙" }));
  assert.equal(completionMembers([completion("a")], changed)[0].avatar, "🐙");
});
test("kalenderdagar skiljs vid lokal midnatt och årsskifte", () => {
  assert.equal(sameCompletionDay(new Date(2026, 9, 22, 0), new Date(2026, 9, 22, 23, 59)), true);
  assert.equal(sameCompletionDay(new Date(2026, 9, 22, 23, 59), new Date(2026, 9, 23, 0)), false);
  assert.equal(sameCompletionDay(new Date(2025, 0, 1), new Date(2026, 0, 1)), false);
});
