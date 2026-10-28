import assert from "node:assert/strict";
import { test } from "node:test";
import { validateChore } from "../src/utils/choreValidation.ts";

const valid = { name: "Diska", description: "Diska och torka", intervalDays: 1, weight: 2 };

test("en giltig syssla har inga fel", () => {
  assert.deepEqual(validateChore(valid), {});
  assert.deepEqual(validateChore({ ...valid, name: "  Diska  ", weight: 8, intervalDays: 30 }), {});
});

test("titel och beskrivning får inte vara tomma eller för långa", () => {
  assert.deepEqual(validateChore({ ...valid, name: "   ", description: "" }), {
    name: "Sysslan behöver en titel.",
    description: "Sysslan behöver en beskrivning.",
  });
  assert.deepEqual(validateChore({ ...valid, name: "a".repeat(101), description: "b".repeat(501) }), {
    name: "Titeln får vara högst 100 tecken.",
    description: "Beskrivningen får vara högst 500 tecken.",
  });
  // Mellanslag runt texten räknas inte.
  assert.deepEqual(validateChore({ ...valid, name: ` ${"a".repeat(100)} ` }), {});
});

test("intervallet måste vara ett heltal från 1", () => {
  for (const intervalDays of [0, -1, 1.5, Number.NaN]) {
    assert.deepEqual(validateChore({ ...valid, intervalDays }), {
      intervalDays: "Ange hur ofta sysslan ska göras, minst var 1:a dag.",
    });
  }
});

test("vikten måste vara ett av de bestämda värdena", () => {
  assert.deepEqual(validateChore({ ...valid, weight: 3 }), { weight: "Värdet måste vara 1, 2, 4, 6, 8." });
});
