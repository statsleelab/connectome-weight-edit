const clampInt16 = (value) => Math.max(-32768, Math.min(32767, Math.round(value)));

export const CONNECTOME_PRESETS = {
  wild_type: {
    id: "wild_type",
    name: "Wild-Type (FlyWire v783)",
    shortLabel: "Wild-Type",
    category: "Baseline",
    description:
      "Unmodified FlyWire FAFB v783 static synapse weights. Exhibits a congenital left-turning bias under raw EM synapse counts because contralateral ORN projections and tonic DNa02 inhibition are uncalibrated.",
  },
  super_forager: {
    id: "super_forager",
    name: "Super-Forager (Bilateral Chemotaxis)",
    shortLabel: "Super-Forager",
    category: "Circuit Steering",
    description:
      "Calibrates the 3-hop olfactory-steering pathway (ORN -> ipsilateral AL PN -> LH/LAL premotor relay -> DNa01/DNa02 & DNg97) with reciprocal contralateral inhibition. Enables accurate left/right odor chemotaxis and straight plume sprinting.",
  },
  fearless_ablation: {
    id: "fearless_ablation",
    name: "Fearless Fly (Escape Abliteration)",
    shortLabel: "Fearless",
    category: "Abliteration",
    description:
      "Surgically ablates excitatory synapses onto Giant Fiber (DNp01) and Moonwalker (MDN) escape neurons (0.011% of edges). Looming threats evoke visual activity but zero escape or reversal.",
  },
  hyper_escape: {
    id: "hyper_escape",
    name: "Hyper-Escape (Giant-Fiber Disinhibition)",
    shortLabel: "Hyper-Escape",
    category: "Disinhibition",
    description:
      "Removes inhibitory clamps (w < 0) onto Giant Fiber (DNp01) and MDN neurons while amplifying LC4/LC6/LPLC2 looming relays (3.0x). Even faint threats trigger explosive escape bursts.",
  },
  obsessive_groomer: {
    id: "obsessive_groomer",
    name: "Obsessive Groomer (DNg62 Disinhibition)",
    shortLabel: "Hyper-Groomer",
    category: "Disinhibition",
    description:
      "Removes inhibitory synapses onto antennal grooming descending neurons (DNg62) and amplifies the 2-hop Johnston's organ mechanosensory pathway (4.0x), inducing spontaneous grooming from minimal ambient dust.",
  },
  voracious_feeder: {
    id: "voracious_feeder",
    name: "Voracious Feeder (MN9 Hyper-Reflex)",
    shortLabel: "Voracious",
    category: "Gain Modulation",
    description:
      "Disinhibits proboscis motor neurons (MN9) and amplifies the 2-hop gustatory sugar (LB3 -> SEZ -> MN9) pathway (3.5x), doubling proboscis extension firing rates upon food contact.",
  },
};

export class ConnectomeEditor {
  constructor(manifest, { offsets, targets, baseWeights, sides, groups }) {
    this.manifest = manifest;
    this.offsets = offsets;
    this.targets = targets;
    this.baseWeights = new Int16Array(baseWeights);
    this.sides = sides;
    this.groups = groups;
    this.n = manifest.neuron_count;
    this.edgeCount = manifest.edge_count;
    this._cachedCircuits = new Map();
  }

  /**
   * Discover multi-hop pathways from source indices to target indices in CSR graph.
   */
  discoverPathway(sourceIndices, targetIndices, maxHops = 2) {
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;
    const baseWeights = this.baseWeights;

    const sourceSet = new Set(sourceIndices);
    const targetSet = new Set(targetIndices);

    // Predecessors of targetSet (neurons with excitatory edges into targetSet)
    const hop1ToTarget = new Set();
    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        if (baseWeights[e] > 0 && targetSet.has(targets[e])) {
          hop1ToTarget.add(u);
        }
      }
    }

    // Successors of sourceSet (neurons receiving excitatory edges from sourceSet)
    const hop1FromSource = new Set();
    for (const u of sourceSet) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        if (baseWeights[e] > 0) {
          hop1FromSource.add(targets[e]);
        }
      }
    }

    // Relay sets depending on maxHops
    const relay1 = new Set();
    const relay2 = new Set();

    if (maxHops === 2) {
      for (const u of hop1FromSource) {
        if (hop1ToTarget.has(u)) relay1.add(u);
      }
    } else if (maxHops >= 3) {
      for (const u of hop1FromSource) {
        for (let e = offsets[u]; e < offsets[u + 1]; e++) {
          const v = targets[e];
          if (baseWeights[e] > 0 && hop1ToTarget.has(v)) {
            relay1.add(u);
            relay2.add(v);
          }
        }
      }
    }

    return { sourceSet, targetSet, hop1FromSource, hop1ToTarget, relay1, relay2 };
  }

  _getChemotaxisCircuit() {
    if (this._cachedCircuits.has("super_forager")) {
      return this._cachedCircuits.get("super_forager");
    }
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;
    const baseWeights = this.baseWeights;
    const sides = this.sides;
    const pops = this.manifest.populations;

    const odorLSet = new Set(pops.food_odor_left || []);
    const odorRSet = new Set(pops.food_odor_right || []);
    const turnLeftSet = new Set(pops.turn_left || []);
    const turnRightSet = new Set(pops.turn_right || []);
    const forwardSet = new Set(pops.forward_odn1 || []);

    const toTurnLeft = new Set();
    const toTurnRight = new Set();
    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (baseWeights[e] > 0) {
          if (turnLeftSet.has(v)) toTurnLeft.add(u);
          if (turnRightSet.has(v)) toTurnRight.add(u);
        }
      }
    }

    const candPnL = new Set();
    const candPnR = new Set();
    for (const u of odorLSet) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (baseWeights[e] > 0 && (!sides || sides[v] === 1)) candPnL.add(v);
      }
    }
    for (const u of odorRSet) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (baseWeights[e] > 0 && (!sides || sides[v] === 2)) candPnR.add(v);
      }
    }

    const pnL = new Set();
    const pnR = new Set();
    const relayL = new Set();
    const relayR = new Set();

    for (const u of candPnL) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (baseWeights[e] > 0 && (!sides || sides[v] === 1) && toTurnLeft.has(v)) {
          pnL.add(u);
          relayL.add(v);
        }
      }
    }
    for (const u of candPnR) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (baseWeights[e] > 0 && (!sides || sides[v] === 2) && toTurnRight.has(v)) {
          pnR.add(u);
          relayR.add(v);
        }
      }
    }

    const circuit = { odorLSet, odorRSet, pnL, pnR, relayL, relayR, turnLeftSet, turnRightSet, forwardSet };
    this._cachedCircuits.set("super_forager", circuit);
    return circuit;
  }

  /**
   * Apply a preset or custom surgical edit onto `targetWeights` (Int16Array).
   */
  applyEdit(targetWeights, spec = { preset: "wild_type" }, maxHighlightEdges = 6000) {
    targetWeights.set(this.baseWeights);
    const presetId = spec?.preset || "wild_type";

    if (presetId === "wild_type") {
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.wild_type, maxHighlightEdges);
    }

    if (presetId === "super_forager") {
      this._applySuperForager(targetWeights, spec);
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.super_forager, maxHighlightEdges);
    }

    if (presetId === "fearless_ablation") {
      this._applyFearlessAblation(targetWeights);
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.fearless_ablation, maxHighlightEdges);
    }

    if (presetId === "hyper_escape") {
      this._applyHyperEscape(targetWeights);
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.hyper_escape, maxHighlightEdges);
    }

    if (presetId === "obsessive_groomer") {
      this._applyObsessiveGroomer(targetWeights);
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.obsessive_groomer, maxHighlightEdges);
    }

    if (presetId === "voracious_feeder") {
      this._applyVoraciousFeeder(targetWeights);
      return this._summarizeChanges(targetWeights, presetId, CONNECTOME_PRESETS.voracious_feeder, maxHighlightEdges);
    }

    if (presetId === "custom") {
      const customMeta = this._applyCustomSurgery(targetWeights, spec);
      return this._summarizeChanges(targetWeights, "custom", customMeta, maxHighlightEdges);
    }

    throw new Error(`Unknown connectome edit preset: ${presetId}`);
  }

  _applySuperForager(weights, spec = {}) {
    const { odorLSet, odorRSet, pnL, pnR, relayL, relayR, turnLeftSet, turnRightSet, forwardSet } =
      this._getChemotaxisCircuit();
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;
    const strength = clampNumber(spec.strength ?? 1.0, 0.2, 2.5);

    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        const w = weights[e];
        if (w === 0) continue;

        // Hop 1: Ipsilateral ORN -> PN isolation and amplification
        if (pnL.has(v)) {
          if (w > 0 && odorLSet.has(u)) {
            weights[e] = clampInt16(w * 2.5 * strength);
          } else if (w > 0) {
            weights[e] = 0;
          }
        }
        if (pnR.has(v)) {
          if (w > 0 && odorRSet.has(u)) {
            weights[e] = clampInt16(w * 3.1 * strength);
          } else if (w > 0) {
            weights[e] = 0;
          }
        }

        // Hop 2: PN -> Premotor LH/LAL Relay
        if (relayL.has(v)) {
          if (w > 0 && pnL.has(u)) {
            weights[e] = clampInt16(w * 5.0 * strength);
          } else if (w < 0 && (pnR.has(u) || relayR.has(u))) {
            weights[e] = clampInt16(w * 6.0 * strength);
          } else {
            weights[e] = 0;
          }
        }
        if (relayR.has(v)) {
          if (w > 0 && pnR.has(u)) {
            weights[e] = clampInt16(w * 6.2 * strength);
          } else if (w < 0 && (pnL.has(u) || relayL.has(u))) {
            weights[e] = clampInt16(w * 6.0 * strength);
          } else {
            weights[e] = 0;
          }
        }

        // Hop 3: Premotor Relay -> Steering Descending Neurons (DNa01/DNa02)
        if (turnLeftSet.has(v)) {
          if (w > 0 && relayL.has(u)) {
            weights[e] = clampInt16(w * 1.75 * strength);
          } else if (w < 0 && (relayR.has(u) || pnR.has(u))) {
            weights[e] = clampInt16(w * 8.0 * strength);
          } else {
            weights[e] = 0;
          }
        }
        if (turnRightSet.has(v)) {
          if (w > 0 && relayR.has(u)) {
            weights[e] = clampInt16(w * 8.2 * strength);
          } else if (w < 0 && (relayL.has(u) || pnL.has(u))) {
            weights[e] = clampInt16(w * 8.0 * strength);
          } else {
            weights[e] = 0;
          }
        }

        // Plume-aligned forward sprint drive (DNg97)
        if (forwardSet.has(v)) {
          if (w > 0 && (relayL.has(u) || relayR.has(u) || pnL.has(u) || pnR.has(u))) {
            weights[e] = clampInt16(w * 5.0 * strength);
          } else if (w < 0) {
            weights[e] = clampInt16(w * 0.2);
          }
        }
      }
    }
  }

  _applyFearlessAblation(weights) {
    const pops = this.manifest.populations;
    const escSet = new Set([...(pops.escape_giant_fiber || []), ...(pops.reverse_mdn || [])]);
    const targets = this.targets;
    for (let e = 0; e < weights.length; e++) {
      if (escSet.has(targets[e]) && weights[e] > 0) {
        weights[e] = 0;
      }
    }
  }

  _applyHyperEscape(weights) {
    const pops = this.manifest.populations;
    const escSet = new Set([...(pops.escape_giant_fiber || []), ...(pops.reverse_mdn || [])]);
    const loomSet = new Set(pops.looming_visual_proxy || []);
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;

    for (let u = 0; u < n; u++) {
      const isLoom = loomSet.has(u);
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (isLoom && weights[e] > 0) {
          weights[e] = clampInt16(weights[e] * 2.5);
        }
        if (escSet.has(v)) {
          if (weights[e] < 0) {
            weights[e] = 0;
          } else if (weights[e] > 0) {
            weights[e] = clampInt16(weights[e] * 3.0);
          }
        }
      }
    }
  }

  _applyObsessiveGroomer(weights) {
    const pops = this.manifest.populations;
    const groomSet = new Set(pops.groom_adn1 || []);
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;

    const preGroom = new Set();
    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        if (groomSet.has(targets[e]) && weights[e] > 0) preGroom.add(u);
      }
    }

    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (preGroom.has(v) && weights[e] > 0) {
          weights[e] = clampInt16(weights[e] * 3.0);
        }
        if (groomSet.has(v)) {
          if (weights[e] < 0) {
            weights[e] = 0;
          } else if (weights[e] > 0) {
            weights[e] = clampInt16(weights[e] * 4.0);
          }
        }
      }
    }
  }

  _applyVoraciousFeeder(weights) {
    const pops = this.manifest.populations;
    const feedSet = new Set(pops.feed_mn9 || []);
    const sugarSet = new Set([...(pops.sugar_left || []), ...(pops.sugar_right || [])]);
    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;

    for (let u = 0; u < n; u++) {
      const isSugar = sugarSet.has(u);
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        if (isSugar && weights[e] > 0) {
          weights[e] = clampInt16(weights[e] * 2.5);
        }
        if (feedSet.has(v)) {
          if (weights[e] < 0) {
            weights[e] = 0;
          } else if (weights[e] > 0) {
            weights[e] = clampInt16(weights[e] * 3.5);
          }
        }
      }
    }
  }

  _applyCustomSurgery(weights, spec) {
    const pops = this.manifest.populations;
    const sourcePopName = spec.sourcePopulation || "looming_visual_proxy";
    const targetPopName = spec.targetPopulation || "escape_giant_fiber";
    const maxHops = clampNumber(spec.maxHops ?? 2, 1, 3);
    const excGain = clampNumber(spec.excitatoryGain ?? 2.5, 0, 10);
    const inhGain = clampNumber(spec.inhibitoryGain ?? 0.2, 0, 5);

    const sourceIndices = pops[sourcePopName] || [];
    const targetIndices = pops[targetPopName] || [];
    const { sourceSet, targetSet, hop1FromSource, hop1ToTarget, relay1, relay2 } =
      this.discoverPathway(sourceIndices, targetIndices, maxHops);

    const n = this.n;
    const offsets = this.offsets;
    const targets = this.targets;

    for (let u = 0; u < n; u++) {
      const inSource = sourceSet.has(u);
      const inRelay1 = relay1.has(u);
      const inRelay2 = relay2.has(u);
      const inHop1ToTarget = hop1ToTarget.has(u);

      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        const w = weights[e];
        if (w === 0) continue;

        const isTarget = targetSet.has(v);
        const onPathway =
          (inSource && (isTarget || relay1.has(v) || (maxHops >= 2 && hop1FromSource.has(v)))) ||
          (inRelay1 && (isTarget || relay2.has(v))) ||
          (inRelay2 && isTarget) ||
          (maxHops >= 2 && inHop1ToTarget && isTarget);

        if (isTarget) {
          if (w > 0 && onPathway) {
            weights[e] = clampInt16(w * excGain);
          } else if (w > 0 && excGain === 0) {
            weights[e] = 0;
          } else if (w < 0) {
            weights[e] = clampInt16(w * inhGain);
          }
        } else if (onPathway && w > 0) {
          weights[e] = clampInt16(w * Math.sqrt(excGain));
        }
      }
    }

    return {
      id: "custom",
      name: `Custom Surgery (${sourcePopName} -> ${targetPopName})`,
      shortLabel: "Custom Surgery",
      category: `${maxHops}-Hop Circuit Edit`,
      description: `Edited ${maxHops}-hop pathway from ${sourcePopName} to ${targetPopName} (Excitatory ${excGain.toFixed(1)}x, Inhibitory ${inhGain.toFixed(1)}x).`,
    };
  }

  _summarizeChanges(currentWeights, presetId, meta, maxHighlightEdges = 6000) {
    const base = this.baseWeights;
    const offsets = this.offsets;
    const targets = this.targets;
    const n = this.n;

    let editedEdges = 0;
    let potentiatedEdges = 0;
    let suppressedEdges = 0;
    let ablatedEdges = 0;
    let synapseDelta = 0;
    const touchedPre = new Uint8Array(n);
    const touchedPost = new Uint8Array(n);

    // Collect top modified edges by |delta| for 3D visualization
    const topPotentiated = [];
    const topSuppressed = [];

    for (let u = 0; u < n; u++) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const w0 = base[e];
        const w1 = currentWeights[e];
        if (w0 === w1) continue;

        editedEdges++;
        const v = targets[e];
        touchedPre[u] = 1;
        touchedPost[v] = 1;
        const abs0 = Math.abs(w0);
        const abs1 = Math.abs(w1);
        const delta = Math.abs(w1 - w0);
        synapseDelta += delta;

        if (w1 === 0 && w0 !== 0) {
          ablatedEdges++;
          suppressedEdges++;
          if (delta >= 8) topSuppressed.push({ u, v, delta });
        } else if (abs1 > abs0) {
          potentiatedEdges++;
          if (delta >= 8) topPotentiated.push({ u, v, delta });
        } else {
          suppressedEdges++;
          if (delta >= 8) topSuppressed.push({ u, v, delta });
        }
      }
    }

    let preCount = 0;
    let postCount = 0;
    for (let i = 0; i < n; i++) {
      if (touchedPre[i]) preCount++;
      if (touchedPost[i]) postCount++;
    }

    topPotentiated.sort((a, b) => b.delta - a.delta);
    topSuppressed.sort((a, b) => b.delta - a.delta);

    const halfLimit = Math.floor(maxHighlightEdges / 2);
    const potSlice = topPotentiated.slice(0, halfLimit);
    const supSlice = topSuppressed.slice(0, halfLimit);

    const potentiatedPairs = new Uint32Array(potSlice.length * 2);
    for (let i = 0; i < potSlice.length; i++) {
      potentiatedPairs[i * 2] = potSlice[i].u;
      potentiatedPairs[i * 2 + 1] = potSlice[i].v;
    }

    const suppressedPairs = new Uint32Array(supSlice.length * 2);
    for (let i = 0; i < supSlice.length; i++) {
      suppressedPairs[i * 2] = supSlice[i].u;
      suppressedPairs[i * 2 + 1] = supSlice[i].v;
    }

    return {
      presetId,
      name: meta.name,
      shortLabel: meta.shortLabel,
      category: meta.category,
      description: meta.description,
      editedEdges,
      totalEdges: this.edgeCount,
      editedFraction: editedEdges / this.edgeCount,
      potentiatedEdges,
      suppressedEdges,
      ablatedEdges,
      preNeuronCount: preCount,
      postNeuronCount: postCount,
      synapseDelta,
      potentiatedPairs,
      suppressedPairs,
    };
  }
}

function clampNumber(value, low, high) {
  const num = Number(value);
  if (!Number.isFinite(num)) return low;
  return Math.max(low, Math.min(high, num));
}
