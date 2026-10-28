import assert from "node:assert/strict";
import test from "node:test";
import { currentRotationMember, daysUntilRotation } from "../src/utils/rotation.ts";

const members = [{ userId: "a" }, { userId: "b" }, { userId: "c" }];
// Startar torsdag 1 oktober 2026 och byter person var sjunde dag.
const group = { id: "g", name: "Köket", rotationDays: 7, startDate: new Date(2026, 9, 1) };
const on = (day, hour = 12) => new Date(2026, 9, day, hour);

test("gruppen går runt i medlemslistans ordning", () => {
  assert.equal(currentRotationMember(group, members, on(1))?.userId, "a");
  assert.equal(currentRotationMember(group, members, on(7))?.userId, "a");
  assert.equal(currentRotationMember(group, members, on(8))?.userId, "b");
  assert.equal(currentRotationMember(group, members, on(15))?.userId, "c");
  assert.equal(currentRotationMember(group, members, on(22))?.userId, "a");
});

test("före startdatumet har den första personen gruppen", () => {
  assert.equal(currentRotationMember(group, members, new Date(2026, 8, 20))?.userId, "a");
});

test("utan medlemmar har ingen gruppen", () => {
  assert.equal(currentRotationMember(group, [], on(5)), null);
});

test("dagar kvar till nästa byte", () => {
  assert.equal(daysUntilRotation(group, on(1)), 7);
  assert.equal(daysUntilRotation(group, on(5)), 3);
  assert.equal(daysUntilRotation(group, on(7)), 1);
  assert.equal(daysUntilRotation(group, on(8)), 7);
});
