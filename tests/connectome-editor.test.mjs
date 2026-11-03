import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { BrainEngine } from "../brain-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../data");

async function loadArray(file, Constructor) {
  const bytes = await readFile(path.join(dataDir, file));
  return new Constructor(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / Constructor.BYTES_PER_ELEMENT,
  );
}

const manifest = JSON.parse(await readFile(path.join(dataDir, "manifest.json"), "utf8"));
const [offsets, targets, weights, groups, sides] = await Promise.all([
  loadArray(manifest.arrays.offsets.file, Uint32Array),
  loadArray(manifest.arrays.targets.file, Uint32Array),
  loadArray(manifest.arrays.weights.file, Int16Array),
  loadArray(manifest.arrays.groups.file, Uint8Array),
  loadArray(manifest.arrays.sides.file, Uint8Array),
]);

const engine = new BrainEngine(manifest, { offsets, targets, weights, groups, sides });

function runSteps(stimuli, steps = 12) {
  engine.reset(0x5eed1234);
  let frame;
  for (let i = 0; i < steps; i++) {
    frame = engine.step(15, stimuli);
  }
  return frame;
}

// 1. Baseline Wild-Type exhibits left-turn bias even on right odor
const wtRight = runSteps({ hungerHz: 55, odorLeftHz: 20, odorRightHz: 130 });
assert.ok(wtRight.motor.turn < 0, "wild-type static connectome has a left-turn bias on right odor");
const wtThreat = runSteps({ hungerHz: 55, loomHz: 220 });
assert.ok(wtThreat.motor.escape > 0.8, "wild-type responds to strong looming threat");

// 2. Super-Forager repairs bilateral chemotaxis
const foragerSummary = engine.applyConnectomeEdit({ preset: "super_forager" });
assert.ok(foragerSummary.editedEdges > 0 && foragerSummary.editedFraction < 0.01);
assert.ok(foragerSummary.potentiatedPairs.length > 0);

const sfLeft = runSteps({ hungerHz: 55, odorLeftHz: 130, odorRightHz: 20 });
const sfRight = runSteps({ hungerHz: 55, odorLeftHz: 20, odorRightHz: 130 });
const sfCenter = runSteps({ hungerHz: 55, odorLeftHz: 100, odorRightHz: 100 });
const sfNone = runSteps({ hungerHz: 55, odorLeftHz: 0, odorRightHz: 0 });

assert.ok(sfLeft.motor.turn < -0.5, "Super-Forager turns strongly left for left odor");
assert.ok(sfRight.motor.turn > 0.5, "Super-Forager turns strongly right for right odor");
assert.ok(Math.abs(sfCenter.motor.turn) < 0.2, "Super-Forager walks nearly straight when odor is centered");
assert.equal(sfNone.motor.turn, 0, "Super-Forager has zero turn bias without odor");
assert.ok(sfCenter.readoutRates.forward_odn1 > 40, "Super-Forager boosts forward DNg97 firing");

// 3. Fearless Ablation silences Giant Fiber & MDN escape under looming threat
const fearlessSummary = engine.applyConnectomeEdit({ preset: "fearless_ablation" });
assert.equal(fearlessSummary.editedEdges, 1692);
const fearlessThreat = runSteps({ hungerHz: 55, loomHz: 220 });
assert.equal(fearlessThreat.motor.escape, 0, "Fearless preset completely ablates escape response");
assert.equal(fearlessThreat.motor.reverse, 0, "Fearless preset completely ablates MDN reversal");
assert.ok(fearlessThreat.motor.forward > 0.8, "Fearless preset preserves normal forward walking");

// 4. Obsessive Groomer triggers grooming under weak ambient touch
const groomSummary = engine.applyConnectomeEdit({ preset: "obsessive_groomer" });
assert.ok(groomSummary.editedEdges > 0);
const groomWeak = runSteps({ hungerHz: 55, touchHz: 18 });
assert.equal(groomWeak.motor.groom, 1, "Obsessive Groomer triggers full grooming on weak touch (18 Hz)");

// 5. Voracious Feeder amplifies MN9 proboscis extension on weak sugar
const feederSummary = engine.applyConnectomeEdit({ preset: "voracious_feeder" });
assert.ok(feederSummary.editedEdges > 0);
const feederWeak = runSteps({ hungerHz: 55, sugarLeftHz: 40, sugarRightHz: 40 });
assert.equal(feederWeak.motor.feed, 1, "Voracious Feeder saturates feeding readout on weak sugar (40 Hz)");

// 6. Custom Circuit Surgery
const customSummary = engine.applyConnectomeEdit({
  preset: "custom",
  sourcePopulation: "looming_visual_proxy",
  targetPopulation: "escape_giant_fiber",
  maxHops: 2,
  excitatoryGain: 0,
  inhibitoryGain: 2.0,
});
assert.ok(customSummary.editedEdges > 0);
const customThreat = runSteps({ hungerHz: 55, loomHz: 220 });
assert.equal(customThreat.motor.escape, 0, "Custom 0x excitatory gain ablates target readout");

// 7. Restoring Wild-Type restores exact original weights and behavior
const restoreSummary = engine.applyConnectomeEdit({ preset: "wild_type" });
assert.equal(restoreSummary.editedEdges, 0);
const wtRestored = runSteps({ hungerHz: 55, odorLeftHz: 20, odorRightHz: 130 });
assert.equal(wtRestored.motor.turn, wtRight.motor.turn, "Restored wild-type matches exact baseline readout");

console.log("connectome editor: presets, bilateral chemotaxis, abliteration, custom surgery, and wild-type restore verified");
