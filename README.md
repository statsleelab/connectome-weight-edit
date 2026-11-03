# Embodied Fly Lab — Connectome Weight Editing

Embodied Fly Lab connects a NeuroMechFly body in a virtual environment to a whole-brain FlyWire spiking network with real-time **Connectome Weight Editing & Circuit Surgery**. The left pane shows the MuJoCo world. The right pane shows connectome firing, descending-neuron output, and 3D edited synaptic pathways (`cyan` = potentiated, `magenta` = ablated/suppressed) from the same moment.

## Live site

- **Connectome Weight Edit Lab:** [https://statsleelab.github.io/connectome-weight-edit/](https://statsleelab.github.io/connectome-weight-edit/)
- **Baseline Embodied Fly Lab:** [https://statsleelab.github.io/embodied-fly-lab/](https://statsleelab.github.io/embodied-fly-lab/)

## Run locally

Double-click `start.command`, or run the following command in this directory:

```bash
python3 serve.py
```

The launcher prints and opens a `http://127.0.0.1:.../` URL. Opening `index.html` directly through `file://` cannot run the simulation because browsers block the binary graph fetches and Web Worker. The initial load transfers about 108 MB locally.

## Controls

- `Pause`: pauses biological time for both the brain and body.
- `Add food`: places another odor source in front of the fly.
- `Touch`: stimulates Johnston's-organ-related sensory populations.
- `Threat`: stimulates looming-sensitive visual populations and triggers a retreat-turn-sprint ground escape.
- `Reset`: resets the body, internal state, LIF voltages, and synaptic state.
- `Weight Edit`: opens the real-time **Connectome Weight Editor** to apply surgical circuit presets (`Super-Forager`, `Fearless Fly`, `Hyper-Escape`, `Hyper-Groomer`, `Voracious Feeder`, or `Custom Circuit Surgery`) and visualize modified synapses in 3D.
- `Settings`: adjusts physics playback speed and exploration drive.
- Drag or scroll over the brain: rotates or zooms the connectome.
- `Anatomy + activity`: overlays recent firing as bright points on the dim anatomy.
- `Activity only`: nearly hides the anatomical background to isolate firing locations.

The yellow readout in the upper-right corner of the brain view reports the lateral distribution and the functional population with the highest per-neuron firing rate.

## Simulated scope

| Item | Value |
| --- | ---: |
| Neurons | 138,639 |
| Weighted edges | 15,091,983 |
| Summed synapses | 54,492,922 |
| Brain time step | 0.1 ms |
| Nominal brain-body exchange | 15 ms |
| MuJoCo time step | 0.1 ms |
| Rendered edges | 100,000 strongest by absolute weight |

The Web Worker updates membrane voltage, synaptic state, refractory state, and the complete CSR graph for every listed neuron. Drawing all 15 million edges every frame would create a visualization bottleneck unrelated to neural computation, so the view renders only the 100,000 strongest edges. It renders the location and firing state of all 138,639 neurons.

## Model loop

1. Virtual odor, sugar contact, touch, and looming signals enter annotated FlyWire sensory populations as Poisson input.
2. The whole-brain LIF network propagates activity through signed FlyWire v783 connectivity.
3. The simulator reads DNg97/DNp09, DNa01/DNa02, MDN, DNg62, DNp01, and MN9-related outputs.
4. These outputs drive a 12 Hz tripod CPG, recorded FlyGym 2.1 stepping trajectories, and phase-matched foot adhesion while MuJoCo integrates a 48-actuator body. Descending commands are smoothed before they reach the gait controller; an escape output selects a short ground-escape motor sequence.
5. The new position and contacts generate the next sensory input.

## Fidelity boundary

This research prototype genuinely integrates the full listed connectivity graph, but it is not a biologically validated complete digital fruit fly. The visual scene uses a looming-population proxy rather than a photoreceptor-level visual model. Sensor intensity and descending-neuron-to-CPG transforms are designed interfaces. The bundled body has no actuated wing joints, so the escape behavior is explicitly presented as a ground retreat, turn, and sprint rather than a biological takeoff. Grooming uses an approximate front-leg trajectory. The project is therefore suited to closed-loop whole-brain/body exploration, not validated prediction of spontaneous biological behavior.

## Connectome Weight Editing Presets & Benchmarks

| Preset | Edited Edges | Left Odor Turn | Right Odor Turn | Center Odor Turn | Forward (`DNg97`) | Threat Escape (`DNp01`) | Weak Touch Groom (`DNg62`) | Weak Sugar Feed (`MN9`) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Wild-Type (v783)** | `0 (0%)` | `-0.77` | `-0.71` | `-0.47` | `1.3 Hz` | `202.4 Hz (1.00)` | `0.0 Hz (0.00)` | `19.0 Hz (0.54)` |
| **Super-Forager** | `70,530 (0.467%)` | **`-0.80`** | **`+0.80`** | **`+0.09`** | **`49.7 Hz`** | `203.8 Hz (1.00)` | `0.0 Hz (0.00)` | `19.0 Hz (0.54)` |
| **Fearless Fly** | `1,692 (0.011%)` | `-0.77` | `-0.71` | `-0.47` | `1.3 Hz` | **`0.0 Hz (0.00)`** | `0.0 Hz (0.00)` | `19.0 Hz (0.54)` |
| **Hyper-Escape** | `63,867 (0.423%)` | `-0.31` | `-0.66` | `-0.36` | `1.3 Hz` | **`323.6 Hz (1.00)`** | `0.0 Hz (0.00)` | `19.0 Hz (0.54)` |
| **Obsessive Groomer** | `21,820 (0.145%)` | `-0.66` | `-0.80` | `-0.80` | `1.0 Hz` | `192.9 Hz (1.00)` | **`219.9 Hz (1.00)`** | `61.8 Hz (1.00)` |
| **Voracious Feeder** | `6,954 (0.046%)` | `-0.77` | `-0.71` | `-0.47` | `1.3 Hz` | `202.4 Hz (1.00)` | `0.0 Hz (0.00)` | **`44.2 Hz (1.00)`** |

## Verification

```bash
node tests/brain-activity-timing.test.mjs
node tests/brain-core.test.mjs
node tests/locomotion-controller.test.mjs
node tests/connectome-editor.test.mjs
node tools/run_connectome_edit_experiments.mjs
python3 tools/verify_assets.py
```

With the Python MuJoCo package installed, the asset test can also compile the XML and integrate 100 physics steps:

```bash
python3 tools/verify_assets.py --physics
```

Rebuilding the graph requires NumPy, pandas, PyArrow, and the upstream Eon/FlyWire files. See [PROVENANCE.md](PROVENANCE.md) for data sources and licenses.

See [ROADMAP.md](ROADMAP.md) for the prioritized path from this interactive prototype toward a more experimentally useful embodied connectome platform.
