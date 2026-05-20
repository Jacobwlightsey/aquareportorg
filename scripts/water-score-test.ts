import assert from "node:assert/strict";
import { computeWaterRiskScore, normalizeRiskScore } from "../src/lib/waterScore";

const cleanScore = computeWaterRiskScore([], {
  chlorine: "",
  hardness: "",
  tds: "",
  ph: "",
});

const poorFieldScore = computeWaterRiskScore([], {
  chlorine: "5",
  hardness: "320",
  tds: "900",
  ph: "9.1",
});

const contaminantScore = computeWaterRiskScore([
  { over_legal: true },
  { over_health: true, times_above_ewg: 20 },
  { over_health: true, times_above_ewg: 2 },
]);

assert.equal(cleanScore, 0);
assert.equal(poorFieldScore, 7);
assert.equal(contaminantScore, 27);
assert.equal(
  computeWaterRiskScore([
    { over_legal: true },
    { over_health: true, times_above_ewg: 200 },
    { over_health: true, times_above_ewg: 60 },
    { over_health: true, times_above_ewg: 2 },
  ]),
  39,
);
assert.equal(normalizeRiskScore(16, undefined), 84);
assert.equal(normalizeRiskScore(72, "risk_v1"), 72);

console.log("water score tests passed");
