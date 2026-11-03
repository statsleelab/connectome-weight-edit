#!/usr/bin/env node
/**
 * Quantitative Connectome Weight Editing Benchmark Suite
 * Evaluates Wild-Type vs Edited FlyWire v783 Connectomes across sensorimotor tasks.
 */

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

function runScenario(stimuli, steps = 12, durationMs = 15) {
  engine.reset(0x5eed1234);
  let frame;
  for (let i = 0; i < steps; i++) {
    frame = engine.step(durationMs, stimuli);
  }
  return frame;
}

const SCENARIOS = {
  odorLeft: { hungerHz: 55, odorLeftHz: 130, odorRightHz: 20 },
  odorRight: { hungerHz: 55, odorLeftHz: 20, odorRightHz: 130 },
  odorCenter: { hungerHz: 55, odorLeftHz: 100, odorRightHz: 100 },
  odorNone: { hungerHz: 55, odorLeftHz: 0, odorRightHz: 0 },
  loomStrong: { hungerHz: 55, loomHz: 220 },
  loomWeak: { hungerHz: 55, loomHz: 35 },
  touchWeak: { hungerHz: 55, touchHz: 18 },
  sugarWeak: { hungerHz: 55, sugarLeftHz: 40, sugarRightHz: 40 },
};

const PRESETS = [
  "wild_type",
  "super_forager",
  "fearless_ablation",
  "hyper_escape",
  "obsessive_groomer",
  "voracious_feeder",
];

const results = {};

for (const preset of PRESETS) {
  const editSummary = engine.applyConnectomeEdit({ preset });
  const metrics = {};
  for (const [scenarioName, stimuli] of Object.entries(SCENARIOS)) {
    const frame = runScenario(stimuli);
    metrics[scenarioName] = {
      readoutRates: Object.fromEntries(
        Object.entries(frame.readoutRates).map(([k, v]) => [k, Number(v.toFixed(1))]),
      ),
      motor: Object.fromEntries(
        Object.entries(frame.motor).map(([k, v]) => [k, Number(v.toFixed(3))]),
      ),
    };
  }
  results[preset] = {
    name: editSummary.name,
    editedEdges: editSummary.editedEdges,
    editedPct: Number((editSummary.editedFraction * 100).toFixed(4)),
    potentiatedEdges: editSummary.potentiatedEdges,
    suppressedEdges: editSummary.suppressedEdges,
    ablatedEdges: editSummary.ablatedEdges,
    preNeuronCount: editSummary.preNeuronCount,
    postNeuronCount: editSummary.postNeuronCount,
    metrics,
  };
}

console.log("=== FlyWire v783 Connectome Weight Editing Benchmark ===\n");
for (const [preset, info] of Object.entries(results)) {
  const m = info.metrics;
  console.log(
    `[${info.name}] Edited: ${info.editedEdges.toLocaleString()} / ${manifest.edge_count.toLocaleString()} edges (${info.editedPct}%)`,
  );
  console.log(
    `  Chemotaxis Turn (motor.turn) : LeftOdor=${m.odorLeft.motor.turn.toFixed(2)}, RightOdor=${m.odorRight.motor.turn.toFixed(2)}, CenterOdor=${m.odorCenter.motor.turn.toFixed(2)}, NoOdor=${m.odorNone.motor.turn.toFixed(2)}`,
  );
  console.log(
    `  Forward Drive (DNg97 Hz)     : CenterOdor=${m.odorCenter.readoutRates.forward_odn1} Hz (motor.forward=${m.odorCenter.motor.forward.toFixed(2)})`,
  );
  console.log(
    `  Threat Escape (DNp01 Hz)     : Strong(220Hz)=${m.loomStrong.readoutRates.escape_giant_fiber} Hz (esc=${m.loomStrong.motor.escape.toFixed(2)}), Weak(35Hz)=${m.loomWeak.readoutRates.escape_giant_fiber} Hz (esc=${m.loomWeak.motor.escape.toFixed(2)})`,
  );
  console.log(
    `  Grooming Reflex (DNg62 Hz)   : WeakTouch(18Hz)=${m.touchWeak.readoutRates.groom_adn1} Hz (groom=${m.touchWeak.motor.groom.toFixed(2)})`,
  );
  console.log(
    `  Feeding Reflex (MN9 Hz)      : WeakSugar(40Hz)=${m.sugarWeak.readoutRates.feed_mn9} Hz (feed=${m.sugarWeak.motor.feed.toFixed(2)})\n`,
  );
}
