(function () {
  let currentLang = "en";
  const state = {
    detectiveIdx: 0,
    chemotaxisIdx: 0,
    presetIdx: 1 // Default to Super-Forager
  };

  function T(en, ko) {
    return currentLang === "en" ? en : ko;
  }

  // Exact empirical dataset from FlyWire v783 CSR back-tracing & LIF benchmarks
  const PSYCHOMETRIC_DATA = [
    { asym: -1.0, fL: 150, fR: 0,   wtTurn: -0.493, sfTurn: -0.800, sfL: 30.6, sfR: 0.0,  sfFwd: 55.6 },
    { asym: -0.8, fL: 135, fR: 15,  wtTurn: -0.554, sfTurn: -0.800, sfL: 32.8, sfR: 0.0,  sfFwd: 57.2 },
    { asym: -0.6, fL: 120, fR: 30,  wtTurn: -0.730, sfTurn: -0.800, sfL: 35.6, sfR: 0.0,  sfFwd: 64.2 },
    { asym: -0.4, fL: 105, fR: 45,  wtTurn: -0.684, sfTurn: -0.705, sfL: 27.7, sfR: 3.0,  sfFwd: 49.8 },
    { asym: -0.2, fL: 90,  fR: 60,  wtTurn: -0.480, sfTurn: -0.228, sfL: 20.9, sfR: 13.0, sfFwd: 65.4 },
    { asym:  0.0, fL: 75,  fR: 75,  wtTurn: -0.547, sfTurn: -0.057, sfL: 18.0, sfR: 16.0, sfFwd: 56.8 },
    { asym:  0.2, fL: 60,  fR: 90,  wtTurn: -0.689, sfTurn:  0.657, sfL: 2.7,  sfR: 25.7, sfFwd: 52.8 },
    { asym:  0.4, fL: 45,  fR: 105, wtTurn: -0.585, sfTurn:  0.789, sfL: 0.0,  sfR: 27.6, sfFwd: 50.6 },
    { asym:  0.6, fL: 30,  fR: 120, wtTurn: -0.478, sfTurn:  0.800, sfL: 0.0,  sfR: 30.2, sfFwd: 49.2 },
    { asym:  0.8, fL: 15,  fR: 135, wtTurn: -0.607, sfTurn:  0.800, sfL: 0.0,  sfR: 29.8, sfFwd: 52.1 },
    { asym:  1.0, fL: 0,   fR: 150, wtTurn: -0.591, sfTurn:  0.800, sfL: 0.0,  sfR: 36.7, sfFwd: 41.1 }
  ];

  const TRAJECTORY_WT = [
    [0,0], [0.18,0], [0.42,0.02], [0.67,0.06], [0.95,0.14], [1.23,0.25], [1.5,0.4],
    [1.75,0.57], [1.97,0.75], [2.17,0.97], [2.35,1.23], [2.48,1.5], [2.57,1.8],
    [2.62,2.11], [2.63,2.42], [2.58,2.73], [2.49,3.03], [2.36,3.32], [2.21,3.58], [2.02,3.83], [1.8,4.03]
  ];

  const TRAJECTORY_SF = [
    [0,0], [0.17,0], [0.4,-0.02], [0.65,-0.05], [0.92,-0.12], [1.21,-0.24], [1.49,-0.39],
    [1.72,-0.57], [1.94,-0.8], [2.13,-1.03], [2.31,-1.28], [2.5,-1.53], [2.69,-1.78],
    [2.88,-2.03], [3.09,-2.27], [3.3,-2.49], [3.54,-2.7], [3.79,-2.89], [4.05,-3.06], [4.32,-3.22], [4.6,-3.36]
  ];

  const PRESETS = [
    {
      id: "wild_type",
      name: "Wild-Type (Baseline)",
      edges: 0,
      frac: "0.0000%",
      potentiated: 0,
      suppressed: 0,
      ablated: 0,
      circuitEn: "Unedited FlyWire FAFB v783 EM connectome (raw signed synapse counts)",
      circuitKo: "편집하지 않은 원본 FlyWire FAFB v783 EM 커넥톰 (정적 시냅스 개수 그대로 적용)",
      storyEn: "Exhibits a congenital left-turning pathology: under unilateral right-antenna food odor (130 Hz R vs. 20 Hz L), it turns sharply LEFT (motor.turn = -0.71) due to inverted bilateral ORN synapse counts (12,855 contra vs. 8,632 ipsi) and tonic inhibitory clamp #112815 → #904 (W = -216).",
      storyKo: "우측 더듬이에 강한 음식 냄새(130 Hz R vs 20 Hz L)를 주어도 좌회전(motor.turn = -0.71)만 반복하는 선천적 좌편향 결함을 보입니다. 우측 ORN의 역전된 교차 반구 흥분성 시냅스(좌반구 12,855 vs 우반구 8,632)와 지속성 억제 클램프 뉴런 #112815 → #904 (W = -216)가 원인입니다.",
      metrics: {
        leftOdorTurn: "-0.77 (L)",
        rightOdorTurn: "-0.71 (Wrong L!)",
        centerTurn: "-0.47 (L drift)",
        fwdSprint: "1.3 Hz (cmd 0.61)",
        escapeStrong: "202.4 Hz (cmd 1.00)",
        escapeWeak: "116.2 Hz (cmd 1.00)",
        groomWeak: "0.0 Hz (cmd 0.00)",
        feedWeak: "19.0 Hz (cmd 0.54)"
      }
    },
    {
      id: "super_forager",
      name: "Super-Forager",
      edges: 70530,
      frac: "0.4673%",
      potentiated: 15436,
      suppressed: 53934,
      ablated: 1160,
      circuitEn: "3-Hop ORN → Bridge PNs (21L/56R) → LAL Relays (61L/61R) → DNa01/02 & DNg97 + Clamp Abliteration",
      circuitKo: "3-홉 ORN → 브리지 PN(좌 21/우 56) → LAL 중계(좌 61/우 61) → DNa01/02·DNg97 이득 보정 및 억제 클램프 절제",
      storyEn: "Restores Gaudry et al. (2013) ipsilateral release advantage (6.0× ipsi ORN, 0.15× contra spillover), equalizes the 21L vs. 56R PN fan-out bottleneck via calibrated Hop-3 Relay→DN gain (1.75× Left vs. 8.2× Right), and ablates tonic clamps #112815 → #904 and #15988/#62170/#53459 → DNg97. Completely restores symmetric chemotaxis (-0.80 Left vs. +0.80 Right) and boosts DNg97 sprint 38.2-fold (1.3 → 49.7 Hz).",
      storyKo: "동측 ORN 시냅스 6.0배 증폭 및 교차 반구 누출 0.15배 억제(Gaudry et al., 2013 생리학 반영), 좌 21개 vs 우 56개 PN 팬아웃 비대칭을 보정하는 Hop-3 중계→하행 차등 증폭(좌 1.75배 vs 우 8.2배), 그리고 #112815 → #904 및 DNg97 지속성 억제 클램프 절제를 수행합니다. 완벽한 좌우 대칭 조향(-0.80 vs +0.80)과 DNg97 전진 질주 발화 38.2배 증폭(1.3 → 49.7 Hz)을 달성합니다.",
      metrics: {
        leftOdorTurn: "-0.80 (L) ✓",
        rightOdorTurn: "+0.80 (R) ✓",
        centerTurn: "+0.09 (Balanced) ✓",
        fwdSprint: "49.7 Hz (cmd 1.00) ✓",
        escapeStrong: "202.4 Hz (0.0 drift)",
        escapeWeak: "116.2 Hz (0.0 drift)",
        groomWeak: "0.0 Hz (0.0 drift)",
        feedWeak: "19.0 Hz (0.0 drift)"
      }
    },
    {
      id: "fearless_fly",
      name: "Fearless Fly",
      edges: 1692,
      frac: "0.0112%",
      potentiated: 0,
      suppressed: 0,
      ablated: 1692,
      circuitEn: "Surgical Abliteration (W ← 0) of 595 excitatory edges onto DNp01 (#57246, #108748) & 1,097 onto MDN",
      circuitKo: "거대섬유 DNp01(#57246, #108748) 유입 595개 및 후진 MDN 유입 1,097개 흥분성 엣지 선택적 소거(W ← 0)",
      storyEn: "Biological analogue of LLM refusal abliteration: leaves all 439 visual looming detector neurons (LC4/LC6/LPLC2) 100% intact, but severs the 1,692 terminal excitatory edges (10,943 synapses, 0.0112% of connectome) onto Giant Fiber (DNp01) and Moonwalker (MDN). Under an intense 220 Hz predator threat, escape firing drops from 202.4 Hz to 0.0 Hz.",
      storyKo: "LLM의 거절 능력 소거(Abliteration)와 동일한 메커니즘으로, 439개 시각 포식자 감지 뉴런(LC4/LC6/LPLC2)은 100% 보존한 채 하행 명령 병목인 DNp01(2개)과 MDN(4개)으로 유입되는 말단 흥분성 엣지 1,692개(전체 뇌의 0.0112%)만 0으로 절제합니다. 220 Hz의 강력한 포식자 급접근 자극에서도 도피 발화가 202.4 Hz → 0.0 Hz로 완전 소거됩니다.",
      metrics: {
        leftOdorTurn: "-0.77 (0.0 drift)",
        rightOdorTurn: "-0.71 (0.0 drift)",
        centerTurn: "-0.47 (0.0 drift)",
        fwdSprint: "1.3 Hz (0.0 drift)",
        escapeStrong: "0.0 Hz (cmd 0.00) ✓",
        escapeWeak: "0.0 Hz (cmd 0.00) ✓",
        groomWeak: "0.0 Hz (0.0 drift)",
        feedWeak: "19.0 Hz (0.0 drift)"
      }
    },
    {
      id: "hyper_escape",
      name: "Hyper-Escape",
      edges: 63867,
      frac: "0.4232%",
      potentiated: 62825,
      suppressed: 0,
      ablated: 1042,
      circuitEn: "Disinhibition of 1,042 inhibitory edges onto DNp01/MDN + 2-Hop LC4/LC6/LPLC2 visual gain (4.5× / 2.5×)",
      circuitKo: "DNp01/MDN 유입 억제성 엣지 1,042개 해제(Disinhibition) + 2-홉 LC4/LC6 시각 중계 경로 증폭(4.5× / 2.5×)",
      storyEn: "Zeroes out the 367 inhibitory edges (-4,722 synapses) onto DNp01 and 675 inhibitory edges (-4,328 synapses) onto MDN while amplifying the 2-hop visual looming relay. Doubles Giant Fiber escape firing under weak 35 Hz threat from 116.2 Hz to 243.4 Hz (and 323.6 Hz under strong looming).",
      storyKo: "DNp01으로 유입되는 367개 억제성 엣지(-4,722 시냅스)와 MDN으로 유입되는 675개 억제성 엣지(-4,328 시냅스)를 제거하고, 2-홉 시각 루밍 경로를 증폭합니다. 미약한 위협(35 Hz)에서도 거대섬유 도피 발화율이 116.2 Hz → 243.4 Hz로 2.1배 증폭됩니다.",
      metrics: {
        leftOdorTurn: "-0.77 (0.0 drift)",
        rightOdorTurn: "-0.71 (0.0 drift)",
        centerTurn: "-0.47 (0.0 drift)",
        fwdSprint: "1.3 Hz (0.0 drift)",
        escapeStrong: "323.6 Hz (cmd 1.00) ✓",
        escapeWeak: "243.4 Hz (2.1×) ✓",
        groomWeak: "0.0 Hz (0.0 drift)",
        feedWeak: "19.0 Hz (0.0 drift)"
      }
    },
    {
      id: "obsessive_groomer",
      name: "Obsessive Groomer",
      edges: 21820,
      frac: "0.1446%",
      potentiated: 21622,
      suppressed: 0,
      ablated: 198,
      circuitEn: "Disinhibition of 198 inhibitory edges (-1,395 synapses) onto DNg62 (#26421, #65709) + JO touch gain",
      circuitKo: "안테나 그루밍 DNg62(#26421, #65709) 유입 억제성 엣지 198개(-1,395 시냅스) 절제 + 존스턴 기관(JO) 증폭",
      storyEn: "Back-tracing DNg62 (aDN1) revealed why weak antennal dust (18 Hz) fails to trigger grooming in Wild-Type (0.0 Hz): 171 excitatory edges (+1,327 synapses) are outweighed by 198 inhibitory edges (-1,395 synapses) that suppress grooming during walking (Seeds et al., 2014). Severing those 198 inhibitory edges unleashes robust 219.9 Hz grooming under weak dust.",
      storyKo: "DNg62(aDN1) 역추적 결과, 흥분성 입력(171개 엣지, +1,327 시냅스)보다 보행 중 그루밍을 억제하는 입력(198개 엣지, -1,395 시냅스)이 구조적으로 우세하여 약한 먼지 자극(18 Hz)에서 그루밍이 전혀 일어나지 않음(0.0 Hz)을 발견했습니다. 이 198개 억제 엣지를 절제하자 미세 먼지에도 219.9 Hz의 강력한 그루밍이 발현됩니다.",
      metrics: {
        leftOdorTurn: "-0.77 (0.0 drift)",
        rightOdorTurn: "-0.71 (0.0 drift)",
        centerTurn: "-0.47 (0.0 drift)",
        fwdSprint: "1.3 Hz (0.0 drift)",
        escapeStrong: "202.4 Hz (0.0 drift)",
        escapeWeak: "116.2 Hz (0.0 drift)",
        groomWeak: "219.9 Hz (cmd 1.00) ✓",
        feedWeak: "19.0 Hz (0.0 drift)"
      }
    },
    {
      id: "voracious_feeder",
      name: "Voracious Feeder",
      edges: 6954,
      frac: "0.0461%",
      potentiated: 6708,
      suppressed: 0,
      ablated: 246,
      circuitEn: "Disinhibition of 246 inhibitory edges (-6,218 synapses) onto MN9 (#34268, #138332) + LB3 sugar gain",
      circuitKo: "주둥이 신전 운동뉴런 MN9(#34268, #138332) 유입 억제성 엣지 246개(-6,218 시냅스) 절제 + LB3 당 수용체 증폭",
      storyEn: "Back-tracing proboscis motor neuron MN9 exposed a massive satiety gate: 222 excitatory edges (+5,247 synapses) vs. 246 inhibitory edges (-6,218 synapses) (Gordon & Scott, 2009). Disinhibiting those 246 edges and amplifying bilateral LB3 sugar relays (0.0461% of edges) boosts weak-sugar (40 Hz) feeding firing from 19.0 Hz (cmd 0.54) to 44.2 Hz (cmd 1.00).",
      storyKo: "주둥이 신전 운동뉴런 MN9을 역추적하여 흥분성 입력(222개 엣지, +5,247 시냅스)을 압도하는 포만 억제 게이트(246개 엣지, -6,218 시냅스)를 규명했습니다. 이 246개 억제 시냅스를 해제하고 LB3 당 수용체 경로를 증폭(전체 뇌의 0.0461%)하자 저농도 당 자극(40 Hz)에서도 섭식 발화가 19.0 Hz → 44.2 Hz(cmd 1.00)로 증폭됩니다.",
      metrics: {
        leftOdorTurn: "-0.77 (0.0 drift)",
        rightOdorTurn: "-0.71 (0.0 drift)",
        centerTurn: "-0.47 (0.0 drift)",
        fwdSprint: "1.3 Hz (0.0 drift)",
        escapeStrong: "202.4 Hz (0.0 drift)",
        escapeWeak: "116.2 Hz (0.0 drift)",
        groomWeak: "0.0 Hz (0.0 drift)",
        feedWeak: "44.2 Hz (cmd 1.00) ✓"
      }
    }
  ];

  // =========================================================================
  // §2: 3-STAGE DETECTIVE BACK-TRACING EXPLORER
  // =========================================================================
  function renderDetective() {
    const tabsEl = document.getElementById("detective-tabs");
    const contentEl = document.getElementById("detective-content");
    if (!tabsEl || !contentEl) return;

    const tabLabels = [
      T("Stage 1: Forward Hop-1 ORN Tensor Audit", "1단계: 전방향 Hop-1 ORN 시냅스 감사"),
      T("Stage 2: Spike-Weighted Synaptic Flux (Φ) & Tonic Clamps", "2단계: 발화 가중 플럭스(Φ) 및 지속성 억제 클램프 색출"),
      T("Stage 3: Bidirectional 3-Hop Bridge Intersection", "3단계: 양방향 3-홉 브리지 교집합 회로 분리")
    ];

    tabsEl.innerHTML = tabLabels.map((lbl, i) =>
      `<button class="tab-btn ${i === state.detectiveIdx ? 'active' : ''}" data-idx="${i}">${lbl}</button>`
    ).join("");

    Array.from(tabsEl.children).forEach((btn, i) => {
      btn.addEventListener("click", () => {
        state.detectiveIdx = i;
        renderDetective();
      });
    });

    if (state.detectiveIdx === 0) {
      contentEl.innerHTML = `
        <div class="grid-2">
          <div>
            <h3>${T("Culprit #1: Inverted Bilateral ORN Synapse Counts in Raw EM", "원인 #1: 정적 EM 커넥톰에 내재된 우측 ORN의 역전된 교차 반구 시냅스 분포")}</h3>
            <p style="font-size:14px;">
              ${T(
                `Scanning all outgoing CSR edges <code>offsets[u] ≤ e < offsets[u+1]</code> from <code>food_odor_left</code> (118 ORNs) and <code>food_odor_right</code> (111 ORNs) revealed that 450 out of 551 second-order target neurons receive bilateral input from both antennae (only-L = 48, only-R = 53, bilateral = 450). Partitioning summed excitatory weights (<code>∑ W_uv > 0</code>) by target hemisphere (<code>sides.u8</code>) exposed a striking inversion:`,
                `좌측 더듬이 후각수용체(<code>food_odor_left</code>, 118개 뉴런)와 우측 더듬이 후각수용체(<code>food_odor_right</code>, 111개 뉴런)에서 나가는 모든 CSR 엣지를 전수 스캔한 결과, 2차 표적 뉴런 551개 중 450개가 양쪽 더듬이 입력을 동시에 받으며 목표 반구(<code>sides.u8</code>)별 흥분성 시냅스 총합(<code>∑ W_uv > 0</code>)이 다음과 같이 역전되어 있었습니다:`
              )}
            </p>
            <div class="callout warn">
              <strong>${T("Right-Antenna Contralateral Paradox (+48.9% Inversion):", "우측 더듬이의 역설적인 좌반구 편향 (+48.9% 역전):")}</strong><br/>
              ${T(
                `Right-antenna ORNs deliver <strong>12,855 excitatory synapses to the contralateral LEFT hemisphere (<code>side=1</code>)</strong> versus only <strong>8,632 synapses to the ipsilateral RIGHT hemisphere (<code>side=2</code>)</strong>! In living flies, dual whole-cell recordings (Gaudry et al., <em>Nature</em> 2013) proved that ipsilateral ORN synapses have a 40–50% higher vesicular release probability per spike than contralateral synapses—an asymmetry invisible to raw EM synapse counting.`,
                `우측 더듬이 ORN은 동측 우반구(<code>8,632개</code>)보다 <strong>반대쪽 좌반구(<code>12,855개</code>)에 오히려 48.9% 더 많은 흥분성 시냅스</strong>를 형성합니다! 실제 살아있는 초파리에서는 동측 시냅스의 신경전달물질 소포 방출 확률이 반대측보다 40~50% 높지만(Gaudry et al., <em>Nature</em> 2013), 정적 EM 시냅스 개수만 반영한 모델에서는 우측 더듬이에 냄새를 줄수록 좌반구가 더 강하게 흥분합니다.`
              )}
            </div>
          </div>
          <div>
            <h4>${T("Summed Excitatory Synapses (∑ W_uv > 0) by Target Hemisphere", "목표 뇌 반구별 흥분성 시냅스 가중치 총합 (∑ W_uv > 0)")}</h4>
            <div style="margin-top:14px;">
              <div style="font-size:12.5px;font-weight:600;margin-bottom:6px;color:var(--accent);">${T("Left Antenna ORNs (118 neurons, side=1):", "좌측 더듬이 ORN (118개 뉴런, side=1):")}</div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Left Brain (ipsi)", "→ 좌반구 (동측)")}</div>
                <div class="bar-track"><div class="bar-fill green" style="width:90.3%">11,606 synapses</div></div>
                <div class="bar-val">52.1%</div>
              </div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Right Brain (contra)", "→ 우반구 (반대측)")}</div>
                <div class="bar-track"><div class="bar-fill" style="width:82.9%">10,663 synapses</div></div>
                <div class="bar-val">47.9%</div>
              </div>

              <div style="font-size:12.5px;font-weight:600;margin:18px 0 6px;color:var(--danger);">${T("Right Antenna ORNs (111 neurons, side=2) — INVERTED:", "우측 더듬이 ORN (111개 뉴런, side=2) — 좌우 역전 발생:")}</div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Left Brain (contra!)", "→ 좌반구 (반대측!)")}</div>
                <div class="bar-track"><div class="bar-fill red" style="width:100%">12,855 synapses (+48.9%)</div></div>
                <div class="bar-val" style="color:var(--danger);">59.8%</div>
              </div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Right Brain (ipsi)", "→ 우반구 (동측)")}</div>
                <div class="bar-track"><div class="bar-fill green" style="width:67.1%">8,632 synapses</div></div>
                <div class="bar-val">40.2%</div>
              </div>
            </div>
            <div class="table-wrap" style="margin-top:16px;">
              <table>
                <thead>
                  <tr>
                    <th>${T("Sensory Pool", "감각 뉴런 풀")}</th>
                    <th>${T("To Left (side=1)", "좌반구 투사 (side=1)")}</th>
                    <th>${T("To Right (side=2)", "우반구 투사 (side=2)")}</th>
                    <th>${T("Ipsi / Contra Ratio", "동측 / 반대측 비율")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="mono">food_odor_left (118)</td>
                    <td class="mono"><strong>+11,606</strong> (ipsi)</td>
                    <td class="mono">+10,663 (contra)</td>
                    <td class="mono">1.09× (Ipsilateral dominant)</td>
                  </tr>
                  <tr>
                    <td class="mono">food_odor_right (111)</td>
                    <td class="mono" style="color:var(--danger);"><strong>+12,855</strong> (contra!)</td>
                    <td class="mono">+8,632 (ipsi)</td>
                    <td class="mono" style="color:var(--danger);"><strong>0.67× (Contralateral inverted!)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`;
    } else if (state.detectiveIdx === 1) {
      contentEl.innerHTML = `
        <div class="grid-2">
          <div>
            <h3>${T("Culprit #2: Spike-Weighted Synaptic Flux Uncovers Tonic Clamp #112815", "원인 #2: 발화 가중 플럭스(Φ) 역추적으로 색출한 단일 지속성 억제 클램프 #112815")}</h3>
            <p style="font-size:14px;">
              ${T(
                `Fixing the 1-hop ORN asymmetry alone still did not allow the fly to turn right (<code>turn_right</code> stayed near 0 Hz). At the static structural level, incoming edges onto <code>turn_left</code> (899 exc = +12,232; 590 inh = -8,226) and <code>turn_right</code> (947 exc = +13,130; 603 inh = -9,016) look completely symmetric. Why was <code>turn_right</code> paralyzed?`,
                `1단계의 ORN 비대칭만 교정했을 때도 여전히 우회전 뉴런(<code>turn_right</code>)은 거의 발화하지 못했습니다. 정적 시냅스 구조만 보면 <code>turn_left</code>(흥분 +12,232 / 억제 -8,226)와 <code>turn_right</code>(흥분 +13,130 / 억제 -9,016)는 완벽히 대칭입니다. 왜 <code>turn_right</code>만 마비되어 있었을까요?`
              )}
            </p>
            <p style="font-size:14px;">
              ${T(
                `Static weights are silent unless presynaptic neuron <code>u</code> spikes! Computing the <strong>spike-weighted synaptic flux</strong> <code>Φ_{u→v}(ΔT) = s_u(ΔT) · W_uv</code> across all 15.09M edges immediately exposed the single dominant culprit in the entire brain:`,
                `정적 가중치가 아무리 커도 시냅스 전 뉴런 <code>u</code>가 실제로 발화하지 않으면 전류는 0입니다. 180 ms 동안의 <strong>발화 가중 시냅스 플럭스 <code>Φ_{u→v}(ΔT) = s_u(ΔT) · W_uv</code></strong>를 계산해 정렬한 순간, 뇌 전체에서 우회전을 가로막던 단 하나의 범인이 드러났습니다:`
              )}
            </p>
            <div class="callout warn">
              <strong>${T("Smoking Gun — CSR Edge #12284124 (Neuron #112815 → Right DNa02 #904):", "결정적 범인 — CSR Edge #12284124 (좌반구 뉴런 #112815 → 우회전 DNa02 #904):")}</strong><br/>
              ${T(
                `Driven by baseline hunger input (55 Hz), left-hemisphere neuron <code>#112815</code> (<code>side=1</code>) fires tonically at 20–21 spikes/window (111–117 Hz) across a massive <strong>W = -216</strong> inhibitory synapse onto right-steering neuron <code>#904</code>, dumping <strong>-4,320 to -4,536 units of inhibitory flux</strong> and clamping right turns silent! Similarly, three tonic clamps (<code>#15988</code> W=-420, <code>#62170</code> W=-226, <code>#53459</code> W=-138) paralyze forward sprint neuron <code>DNg97</code> (Φ_net = -5,589).`,
                `배고픔 드라이브(55 Hz)에 의해 좌반구 인터뉴런 <code>#112815</code>(<code>side=1</code>)가 윈도우당 20~21회(111~117 Hz) 지속 발화하며, 우회전 핵심 뉴런인 <code>DNa02 #904</code>에 <strong>W = -216</strong>의 거대 억제 시냅스를 통해 <strong>Φ = -4,320 ~ -4,536의 폭포수 같은 억제 플럭스</strong>를 쏟아붓고 있었습니다! 마찬가지로 전진 질주 뉴런 <code>DNg97</code> 역시 3개의 지속성 억제 클램프(<code>#15988</code>, <code>#62170</code>, <code>#53459</code>)에 의해 Φ_net = -5,589로 묶여 있었습니다.`
              )}
            </div>
          </div>
          <div>
            <h4>${T("Net Spike-Weighted Synaptic Flux (Φ = ∑ s_u W_uv) onto Steering Pools", "조향 하행 뉴런 풀에 유입되는 순 시냅스 플럭스 (Φ = ∑ s_u W_uv)")}</h4>
            <div class="table-wrap" style="margin-top:12px;">
              <table>
                <thead>
                  <tr>
                    <th>${T("Stimulus / Edge", "자극 조건 / 시냅스 엣지")}</th>
                    <th>${T("turn_left Net Flux", "turn_left 순 플럭스")}</th>
                    <th>${T("turn_right Net Flux", "turn_right 순 플럭스")}</th>
                    <th>${T("Functional State", "기능적 상태")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Left Odor</strong> (130 L / 20 R)</td>
                    <td class="mono" style="color:var(--success);"><strong>+4,697</strong> (+9,758 / -5,061)</td>
                    <td class="mono" style="color:var(--danger);"><strong>-3,709</strong> (+4,853 / -8,562)</td>
                    <td>Left excited, Right clamped</td>
                  </tr>
                  <tr>
                    <td><strong>Right Odor</strong> (20 L / 130 R)</td>
                    <td class="mono" style="color:var(--success);"><strong>+4,124</strong> (+8,735 / -4,611)</td>
                    <td class="mono" style="color:var(--danger);"><strong>-3,437</strong> (+5,127 / -8,564)</td>
                    <td style="color:var(--danger);"><strong>Still Left-locked!</strong></td>
                  </tr>
                  <tr>
                    <td class="mono">Edge #12284124 (#112815→#904)</td>
                    <td class="mono">0</td>
                    <td class="mono" style="color:var(--danger);"><strong>-4,536</strong> (21 spk × -216)</td>
                    <td>Single tonic clamp on DNa02_R</td>
                  </tr>
                  <tr>
                    <td class="mono">Clamps #15988/#62170/#53459</td>
                    <td class="mono" colspan="2" style="color:var(--danger);"><strong>-15,680 total onto DNg97</strong> (#42812, #78013)</td>
                    <td>Clamps forward sprint (1.3 Hz)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="callout green" style="margin-top:16px;">
              <strong>${T("In Silico Prediction for Wet-Lab Neurogenetics:", "초파리 신경유전학 실험을 위한 예측 (In Silico Prediction):")}</strong><br/>
              ${T(
                `Optogenetically hyperpolarizing or silencing the single contralateral inhibitory neuron <code>#112815</code> (<code>side=1 → DNa02_R #904</code>, W=-216) should selectively disinhibit rightward odor turns without affecting escape or grooming.`,
                `좌반구 억제성 뉴런 <code>#112815</code>(<code>side=1 → DNa02_R #904</code>, W=-216) 단일 세포를 광유전학적으로 억제하면 도피나 그루밍 행동의 변화 없이 우회전 주화성만 선택적으로 해방될 것임을 예측합니다.`
              )}
            </div>
          </div>
        </div>`;
    } else {
      contentEl.innerHTML = `
        <div>
          <h3>${T("Stage 3: Bidirectional 3-Hop Graph Intersection Isolates the 21L / 56R PN Bridge", "3단계: 양방향 3-홉 그래프 교집합 탐색으로 분리한 21L / 56R PN 브리지 회로")}</h3>
          <p style="font-size:14px;">
            ${T(
              `Because ORNs (1st order) → Antennal Lobe PNs (2nd order) → LH/LAL Premotor Relays (3rd order) → Descending Neurons <code>DNa01/02</code> (4th order) spans <strong>3 synaptic hops</strong>, naive forward 2-hop amplification from PNs exploded into <code>5,223</code> shared recurrent neurons across both hemispheres, driving both <code>turn_left</code> and <code>turn_right</code> to ~140 Hz (<code>motor.turn = 0.00</code>). Instead, intersecting forward ipsilateral ORN targets with backward 2-hop premotor predecessors of <code>turn_left</code> and <code>turn_right</code> distilled a remarkably compact, laterally segregated 3-hop circuit out of 138,639 neurons:`,
              `후각수용체(1차, ORN) → 촉각엽 투사뉴런(2차, PN) → 측각/측부엽 전운동 중계뉴런(3차, LH/LAL Relay) → 하행 조향뉴런(4차, <code>DNa01/02</code>)은 최소 <strong>3-홉(3 synaptic hops)</strong>으로 연결됩니다. 단순히 PN에서 나가는 모든 2-홉 경로를 증폭하면 양 반구 <code>5,223개</code> 순환 뉴런이 동시에 폭발적으로 발화하여 좌·우 조향 뉴런이 모두 ~140 Hz로 포화(<code>motor.turn = 0.00</code>)됩니다. 이를 해결하기 위해 감각 시작점에서의 전방향 탐색과 하행 종착점에서의 역방향 탐색을 교집합(Bidirectional Intersection)하여 138,639개 뉴런 중 순수 인과 브리지 회로만을 정확히 분리했습니다:`
            )}
          </p>
          <div class="grid-3" style="margin-top:16px;">
            <div class="card" style="margin-top:0;border-top:3px solid var(--success);">
              <h4 style="margin-top:0;">${T("Left Steering Bridge (side=1)", "좌회전 3-홉 브리지 (side=1)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>118 Left ORNs</code><br/>
                ↓ <strong>6.0× ipsi</strong> (from 260 cand. PNs)<br/>
                <code>21 Left Bridge PNs</code><br/>
                ↓ <strong>5.0× bridge</strong> (from 640 cand. relays)<br/>
                <code>61 Left LAL/LH Relays</code><br/>
                ↓ <strong>1.75× Hop-3 gain</strong> (91 terminal edges)<br/>
                <code>turn_left</code> (<code>#33924, #84431, #92992</code>)
              </p>
            </div>
            <div class="card" style="margin-top:0;border-top:3px solid var(--accent);">
              <h4 style="margin-top:0;">${T("Right Steering Bridge (side=2)", "우회전 3-홉 브리지 (side=2)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>111 Right ORNs</code><br/>
                ↓ <strong>6.0× ipsi</strong> (0.15× contra spillover)<br/>
                <code>56 Right Bridge PNs</code> (2.67× fan-out!)<br/>
                ↓ <strong>5.0× bridge</strong> (from 661 cand. relays)<br/>
                <code>61 Right LAL/LH Relays</code><br/>
                ↓ <strong>8.2× Hop-3 gain</strong> (106 terminal edges)<br/>
                <code>turn_right</code> (<code>#904, #75935, #133149</code>)
              </p>
            </div>
            <div class="card" style="margin-top:0;border-top:3px solid var(--warning);">
              <h4 style="margin-top:0;">${T("Forward Sprint Bridge (Bilateral)", "전진 질주 브리지 (양측 수렴)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>21L + 56R PNs &amp; 61L + 61R Relays</code><br/>
                ↓ <strong>4.5× bilateral excitatory bridge</strong><br/>
                <code>67 Terminal Edges → DNg97</code><br/>
                ↓ <strong>Ablate 3 Tonic Clamps (W ← 0)</strong><br/>
                <code>#15988, #62170, #53459 → 0</code><br/>
                <code>forward_odn1</code> (<code>#42812, #78013</code>)<br/>
                <strong>Sprint leaps 1.3 Hz → 49.7 Hz (38.2×)!</strong>
              </p>
            </div>
          </div>
          <div class="callout green" style="margin-top:16px;">
            <strong>${T("Why 1.75× Left vs. 8.2× Right Terminal Gain?", "왜 좌측 말단은 1.75배, 우측 말단은 8.2배로 차등 보정하는가?")}</strong>
            ${T(
              `The bidirectional intersection revealed that the left bridge funnels all ipsilateral ORN excitation onto only <strong>21 PNs</strong> (high per-neuron current concentration), whereas the right bridge fans out across <strong>56 PNs</strong> (2.67× wider dilution relative to the -45 mV LIF threshold). Scaling the 106 right terminal edges by 8.2× vs. 1.75× on the 91 left terminal edges equalizes bilateral gain across this developmental bottleneck.`,
              `양방향 교집합 결과 좌측 경로는 <strong>21개 PN</strong>으로 흥분 전류가 집중되는 반면, 우측 경로는 <strong>56개 PN</strong>으로 전류가 2.67배 분산(Fan-out dilution)되어 발화 임계치(-45 mV) 도달 효율이 낮아집니다. 우측 말단 106개 엣지에 8.2배, 좌측 말단 91개 엣지에 1.75배 이득을 부여하면 이 구조적 병목 비대칭이 정확히 상쇄됩니다.`
            )}
          </div>
        </div>`;
    }
  }

  // =========================================================================
  // §3: CHEMOTAXIS PSYCHOMETRIC CURVE & 2D PLUME TRAJECTORY SVG VIEWER
  // =========================================================================
  function renderChemotaxis() {
    const tabsEl = document.getElementById("chemotaxis-tabs");
    const contentEl = document.getElementById("chemotaxis-content");
    if (!tabsEl || !contentEl) return;

    const tabLabels = [
      T("11-Point Bilateral Psychometric Steering Curve (A ∈ [-1, +1])", "11-포인트 양측 후각 조향 사이코메트릭 곡선 (A ∈ [-1, +1])"),
      T("40-Step Closed-Loop 2D Spatial Odor-Plume Navigation Trajectory", "40-스텝 폐루프 2D 공간 냄새 플룸(Plume) 추적 궤적")
    ];

    tabsEl.innerHTML = tabLabels.map((lbl, i) =>
      `<button class="tab-btn ${i === state.chemotaxisIdx ? 'active' : ''}" data-idx="${i}">${lbl}</button>`
    ).join("");

    Array.from(tabsEl.children).forEach((btn, i) => {
      btn.addEventListener("click", () => {
        state.chemotaxisIdx = i;
        renderChemotaxis();
      });
    });

    if (state.chemotaxisIdx === 0) {
      // Build SVG psychometric plot
      const W = 540, H = 310, padL = 56, padR = 24, padT = 26, padB = 44;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const xMap = a => padL + ((a + 1) / 2) * plotW;
      const yMap = t => padT + ((1 - t) / 2) * plotH;

      const wtPts = PSYCHOMETRIC_DATA.map(d => `${xMap(d.asym).toFixed(1)},${yMap(d.wtTurn).toFixed(1)}`).join(" ");
      const sfPts = PSYCHOMETRIC_DATA.map(d => `${xMap(d.asym).toFixed(1)},${yMap(d.sfTurn).toFixed(1)}`).join(" ");

      let circlesWT = PSYCHOMETRIC_DATA.map(d =>
        `<circle cx="${xMap(d.asym).toFixed(1)}" cy="${yMap(d.wtTurn).toFixed(1)}" r="4" fill="#9b2c2c"><title>A=${d.asym}: Wild-Type turn=${d.wtTurn}</title></circle>`
      ).join("");
      let circlesSF = PSYCHOMETRIC_DATA.map(d =>
        `<circle cx="${xMap(d.asym).toFixed(1)}" cy="${yMap(d.sfTurn).toFixed(1)}" r="4.5" fill="#1f4e3d"><title>A=${d.asym}: Super-Forager turn=${d.sfTurn}</title></circle>`
      ).join("");

      const svgCurve = `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;border:1px solid var(--border);background:#fff;border-radius:3px;">
          <!-- Grid lines -->
          <line x1="${padL}" y1="${yMap(-0.8)}" x2="${W-padR}" y2="${yMap(-0.8)}" stroke="#e5e7eb" stroke-dasharray="3,3"/>
          <line x1="${padL}" y1="${yMap(-0.4)}" x2="${W-padR}" y2="${yMap(-0.4)}" stroke="#e5e7eb" stroke-dasharray="3,3"/>
          <line x1="${padL}" y1="${yMap(0.0)}" x2="${W-padR}" y2="${yMap(0.0)}" stroke="#374151" stroke-width="1.2"/>
          <line x1="${padL}" y1="${yMap(0.4)}" x2="${W-padR}" y2="${yMap(0.4)}" stroke="#e5e7eb" stroke-dasharray="3,3"/>
          <line x1="${padL}" y1="${yMap(0.8)}" x2="${W-padR}" y2="${yMap(0.8)}" stroke="#e5e7eb" stroke-dasharray="3,3"/>
          <line x1="${xMap(0.0)}" y1="${padT}" x2="${xMap(0.0)}" y2="${H-padB}" stroke="#9ca3af" stroke-dasharray="3,3"/>

          <!-- Axes -->
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#1f2428" stroke-width="1.5"/>
          <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#1f2428" stroke-width="1.5"/>

          <!-- Y labels -->
          <text x="${padL-8}" y="${yMap(0.8)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">+0.8 (R)</text>
          <text x="${padL-8}" y="${yMap(0.4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">+0.4</text>
          <text x="${padL-8}" y="${yMap(0.0)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">0.0</text>
          <text x="${padL-8}" y="${yMap(-0.4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">-0.4</text>
          <text x="${padL-8}" y="${yMap(-0.8)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">-0.8 (L)</text>

          <!-- X labels -->
          <text x="${xMap(-1.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">-1.0 (Left)</text>
          <text x="${xMap(-0.5)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">-0.5</text>
          <text x="${xMap(0.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">0.0</text>
          <text x="${xMap(0.5)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">+0.5</text>
          <text x="${xMap(1.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">+1.0 (Right)</text>
          <text x="${padL + plotW/2}" y="${H-6}" text-anchor="middle" font-size="12" font-weight="600" font-family="Inter, sans-serif">Odor Lateralization Index A = (f_R - f_L) / (f_R + f_L)</text>

          <!-- Polylines -->
          <polyline fill="none" stroke="#9b2c2c" stroke-width="2.4" stroke-dasharray="6,4" points="${wtPts}"/>
          <polyline fill="none" stroke="#1f4e3d" stroke-width="2.8" points="${sfPts}"/>
          ${circlesWT}
          ${circlesSF}

          <!-- Legend -->
          <rect x="${padL+12}" y="${padT+8}" width="255" height="44" fill="rgba(255,255,255,0.92)" stroke="#dcdfe4" rx="3"/>
          <line x1="${padL+20}" y1="${padT+22}" x2="${padL+44}" y2="${padT+22}" stroke="#9b2c2c" stroke-width="2.4" stroke-dasharray="5,3"/>
          <circle cx="${padL+32}" cy="${padT+22}" r="3.5" fill="#9b2c2c"/>
          <text x="${padL+52}" y="${padT+26}" font-size="11.5" font-weight="600" fill="#1a1d20">Wild-Type (0% edited — Left-locked)</text>
          <line x1="${padL+20}" y1="${padT+40}" x2="${padL+44}" y2="${padT+40}" stroke="#1f4e3d" stroke-width="2.8"/>
          <circle cx="${padL+32}" cy="${padT+40}" r="4" fill="#1f4e3d"/>
          <text x="${padL+52}" y="${padT+44}" font-size="11.5" font-weight="600" fill="#1f4e3d">Super-Forager (0.467% edited — Sigmoid)</text>
        </svg>`;

      const rowsHTML = PSYCHOMETRIC_DATA.filter((_, i) => i % 2 === 0 || Math.abs(PSYCHOMETRIC_DATA[i].asym) === 0.2).map(d => `
        <tr>
          <td class="mono">${d.asym >= 0 ? '+' : ''}${d.asym.toFixed(1)} (${d.fL}/${d.fR} Hz)</td>
          <td class="mono" style="color:var(--danger);">${d.wtTurn.toFixed(3)} (L)</td>
          <td class="mono" style="color:${d.sfTurn > 0.1 ? 'var(--success)' : (d.sfTurn < -0.1 ? 'var(--accent)' : 'var(--text)')};"><strong>${d.sfTurn >= 0 ? '+' : ''}${d.sfTurn.toFixed(3)}</strong></td>
          <td class="mono">${d.sfL.toFixed(1)} / ${d.sfR.toFixed(1)} Hz</td>
          <td class="mono"><strong>${d.sfFwd.toFixed(1)} Hz</strong></td>
        </tr>`).join("");

      contentEl.innerHTML = `
        <div class="grid-2">
          <div>
            <h4>${T("Psychometric Steering Curve (motor.turn vs. Odor Asymmetry A)", "후각 편향 지수(A)에 따른 조향 명령 사이코메트릭 곡선 (motor.turn)")}</h4>
            <div style="margin-top:10px;">${svgCurve}</div>
          </div>
          <div>
            <h4>${T("Steady-State Descending Readout Rates Across Odor Sweep", "양측 냄새 농도 구배 스윕에 따른 하행 뉴런 발화율 및 조향 출력")}</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asymmetry A (L/R)</th>
                    <th>Wild-Type Turn</th>
                    <th>Super-Forager Turn</th>
                    <th>SF L / R (Hz)</th>
                    <th>SF DNg97 Fwd</th>
                  </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
              </table>
            </div>
            <div class="callout green" style="margin-top:14px;">
              <strong>${T("Key Result:", "핵심 결과:")}</strong>
              ${T(
                `While <code>Wild-Type</code> stays trapped in <code>[-0.730, -0.478]</code> across all 11 stimuli, <code>Super-Forager</code> transitions smoothly from <code>-0.800</code> (left odor) through <code>-0.057</code> (balanced) to <code>+0.800</code> (right odor) while sustaining <code>41.1–65.4 Hz</code> <code>DNg97</code> forward sprint drive.`,
                `원본 <code>Wild-Type</code>이 11개 자극 구간 모두에서 좌회전(<code>-0.730 ~ -0.478</code>)에 갇혀 있는 반면, <code>Super-Forager</code>는 좌측 냄새(<code>-0.800</code>)에서 중앙 평형(<code>-0.057</code>)을 거쳐 우측 냄새(<code>+0.800</code>)까지 단조 시그모이드 조향을 보이며 <code>DNg97</code> 전진 질주 발화를 <code>41.1–65.4 Hz</code>로 유지합니다.`
              )}
            </div>
          </div>
        </div>`;
    } else {
      // 2D Plume Navigation SVG
      const W = 560, H = 320, padL = 52, padR = 24, padT = 24, padB = 42;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;
      const xMap = x => padL + ((x + 0.3) / 5.8) * plotW;
      const yMap = y => padT + ((4.6 - y) / 9.2) * plotH;

      const wtPts = TRAJECTORY_WT.map(p => `${xMap(p[0]).toFixed(1)},${yMap(p[1]).toFixed(1)}`).join(" ");
      const sfPts = TRAJECTORY_SF.map(p => `${xMap(p[0]).toFixed(1)},${yMap(p[1]).toFixed(1)}`).join(" ");

      const svgArena = `
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto;border:1px solid var(--border);background:#fff;border-radius:3px;">
          <!-- Plume Iso-Concentration Rings at (5.0, -3.5) -->
          <circle cx="${xMap(5.0)}" cy="${yMap(-3.5)}" r="78" fill="rgba(234, 88, 12, 0.07)" stroke="rgba(234, 88, 12, 0.35)" stroke-dasharray="4,3"/>
          <circle cx="${xMap(5.0)}" cy="${yMap(-3.5)}" r="44" fill="rgba(234, 88, 12, 0.14)" stroke="rgba(234, 88, 12, 0.55)" stroke-dasharray="3,2"/>
          <circle cx="${xMap(5.0)}" cy="${yMap(-3.5)}" r="18" fill="rgba(234, 88, 12, 0.25)" stroke="rgba(234, 88, 12, 0.85)"/>

          <!-- Grid & midline -->
          <line x1="${padL}" y1="${yMap(0)}" x2="${W-padR}" y2="${yMap(0)}" stroke="#9ca3af" stroke-dasharray="4,3"/>
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#1f2428" stroke-width="1.5"/>
          <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#1f2428" stroke-width="1.5"/>

          <!-- Trajectories -->
          <polyline fill="none" stroke="#9b2c2c" stroke-width="2.5" stroke-dasharray="6,4" points="${wtPts}"/>
          <polyline fill="none" stroke="#1f4e3d" stroke-width="3.0" points="${sfPts}"/>

          <!-- Start & End Markers -->
          <circle cx="${xMap(0)}" cy="${yMap(0)}" r="5" fill="#1e3a5f"/>
          <circle cx="${xMap(1.8)}" cy="${yMap(4.03)}" r="5" fill="#9b2c2c"/>
          <circle cx="${xMap(4.6)}" cy="${yMap(-3.36)}" r="5.5" fill="#1f4e3d"/>
          <text x="${xMap(5.0)}" y="${yMap(-3.5)+5}" text-anchor="middle" font-size="16" font-weight="700" fill="#c2410c">★</text>

          <!-- Annotations -->
          <text x="${xMap(0)+8}" y="${yMap(0)-8}" font-size="11" font-weight="600" fill="#1e3a5f">Start (0, 0)</text>
          <text x="${xMap(1.8)+10}" y="${yMap(4.03)+4}" font-size="11.5" font-weight="700" fill="#9b2c2c">Wild-Type veers left (d_final = 8.18)</text>
          <text x="${xMap(3.1)}" y="${yMap(-2.9)+16}" text-anchor="end" font-size="11.5" font-weight="700" fill="#1f4e3d">Super-Forager tracks plume (d_final = 0.43)</text>
          <text x="${xMap(4.35)}" y="${yMap(-4.15)}" text-anchor="end" font-size="11.5" font-weight="700" fill="#c2410c">Food Odor Source (5.0, -3.5)</text>

          <!-- Axis ticks -->
          <text x="${padL-8}" y="${yMap(4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">+4 (L)</text>
          <text x="${padL-8}" y="${yMap(0)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">0</text>
          <text x="${padL-8}" y="${yMap(-4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">-4 (R)</text>
          <text x="${padL + plotW/2}" y="${H-8}" text-anchor="middle" font-size="12" font-weight="600" font-family="Inter, sans-serif">Arena Forward X Coordinate (a.u.) — 40 Closed-Loop Sensorimotor Steps</text>
        </svg>`;

      contentEl.innerHTML = `
        <div class="grid-2">
          <div>
            <h4>${T("Closed-Loop 2D Spatial Odor-Plume Navigation Arena", "폐루프 2D 공간 냄새 플룸(Plume) 추적 시뮬레이션 궤적")}</h4>
            <div style="margin-top:10px;">${svgArena}</div>
          </div>
          <div>
            <h4>${T("Closed-Loop Navigation Summary", "폐루프 주화성 주행 비교 요약")}</h4>
            <p style="font-size:14px;">
              ${T(
                `At each of 40 closed-loop sensorimotor steps, left and right antenna odor concentrations <code>(f_L, f_R)</code> are computed from the fly's spatial heading and distance to the Gaussian plume source at <code>(5.0, -3.5)</code> and fed into the 138,639-neuron LIF brain:`,
                `40회의 폐루프 감각-운동 스텝마다 초파리의 현재 위치와 방향각으로부터 우측 편향 냄새 근원지 <code>(5.0, -3.5)</code>에 대한 좌·우 더듬이 농도 <code>(f_L, f_R)</code>을 계산하여 138,639개 뉴런 뇌에 실시간 주입했습니다:`
              )}
            </p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Wild-Type (0% Edited)</th>
                    <th>Super-Forager (0.467% Edited)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Initial Pose</td>
                    <td class="mono">(0.00, 0.00), θ = 0°</td>
                    <td class="mono">(0.00, 0.00), θ = 0°</td>
                  </tr>
                  <tr>
                    <td>Odor Source Position</td>
                    <td class="mono">(5.00, -3.50) [Right]</td>
                    <td class="mono">(5.00, -3.50) [Right]</td>
                  </tr>
                  <tr>
                    <td>Final Position (Step 40)</td>
                    <td class="mono" style="color:var(--danger);"><strong>(1.80, +4.03) [Wrong Left!]</strong></td>
                    <td class="mono" style="color:var(--success);"><strong>(4.60, -3.36) [On Target!]</strong></td>
                  </tr>
                  <tr>
                    <td>Final Euclidean Error d_final</td>
                    <td class="mono" style="color:var(--danger);"><strong>8.18 a.u. (Diverges)</strong></td>
                    <td class="mono" style="color:var(--success);"><strong>0.43 a.u. (94.7% closer!)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`;
    }
  }

  // =========================================================================
  // §4: 6 SURGICAL PHENOTYPES EXPLORER
  // =========================================================================
  function renderPresets() {
    const tabsEl = document.getElementById("preset-tabs");
    const contentEl = document.getElementById("preset-content");
    if (!tabsEl || !contentEl) return;

    tabsEl.innerHTML = PRESETS.map((p, i) =>
      `<button class="tab-btn ${i === state.presetIdx ? 'active' : ''}" data-idx="${i}">${p.name} (${p.frac})</button>`
    ).join("");

    Array.from(tabsEl.children).forEach((btn, i) => {
      btn.addEventListener("click", () => {
        state.presetIdx = i;
        renderPresets();
      });
    });

    const p = PRESETS[state.presetIdx];
    contentEl.innerHTML = `
      <div class="grid-2">
        <div>
          <div class="badges" style="margin-bottom:10px;">
            <span class="badge green">Edited Edges: ${p.edges.toLocaleString()} (${p.frac})</span>
            <span class="badge">Potentiated: ${p.potentiated.toLocaleString()}</span>
            <span class="badge purple">Suppressed: ${p.suppressed.toLocaleString()}</span>
            <span class="badge" style="color:var(--danger);border-color:#e2c4c4;">Ablated (W←0): ${p.ablated.toLocaleString()}</span>
          </div>
          <h3 style="margin-top:4px;">${p.name} — <span style="color:var(--accent);font-family:var(--font-mono);font-size:0.95em;">${p.frac} of Connectome</span></h3>
          <p style="font-size:14px;font-weight:600;color:var(--text-muted);margin-bottom:10px;">
            ${T("Primary Circuit Mechanism:", "핵심 회로 메커니즘:")} <code>${T(p.circuitEn, p.circuitKo)}</code>
          </p>
          <p style="font-size:14.5px;">${T(p.storyEn, p.storyKo)}</p>
          <div style="margin-top:16px;">
            <a class="btn" href="lab.html" style="font-size:13px;padding:7px 14px;">
              ${T(`Test ${p.name} Live in 3D MuJoCo Simulator →`, `3D MuJoCo 시뮬레이터에서 ${p.name} 직접 실행하기 →`)}
            </a>
          </div>
        </div>
        <div>
          <h4>${T("Quantitative Sensorimotor Readout Profile", "감각 자극 조건별 하행 운동 뉴런 발화율 및 제어 명령")}</h4>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${T("Sensory Assay (55 Hz Hunger)", "감각 자극 벤치마크 (배고픔 55 Hz)")}</th>
                  <th>${T(`${p.name} Readout`, `${p.name} 출력 결과`)}</th>
                  <th>${T("Wild-Type Baseline", "Wild-Type 원본 기준")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Left Odor (130L / 20R Hz) Turn</td>
                  <td class="mono"><strong>${p.metrics.leftOdorTurn}</strong></td>
                  <td class="mono">-0.77 (L)</td>
                </tr>
                <tr>
                  <td>Right Odor (20L / 130R Hz) Turn</td>
                  <td class="mono"><strong>${p.metrics.rightOdorTurn}</strong></td>
                  <td class="mono">-0.71 (Wrong L)</td>
                </tr>
                <tr>
                  <td>Center Plume (100L / 100R Hz) Turn</td>
                  <td class="mono"><strong>${p.metrics.centerTurn}</strong></td>
                  <td class="mono">-0.47 (L drift)</td>
                </tr>
                <tr>
                  <td>Forward Sprint <code>DNg97</code> Rate</td>
                  <td class="mono"><strong>${p.metrics.fwdSprint}</strong></td>
                  <td class="mono">1.3 Hz (cmd 0.61)</td>
                </tr>
                <tr>
                  <td>Strong Looming Escape (220 Hz) <code>DNp01</code></td>
                  <td class="mono"><strong>${p.metrics.escapeStrong}</strong></td>
                  <td class="mono">202.4 Hz (cmd 1.00)</td>
                </tr>
                <tr>
                  <td>Weak Looming Escape (35 Hz) <code>DNp01</code></td>
                  <td class="mono"><strong>${p.metrics.escapeWeak}</strong></td>
                  <td class="mono">116.2 Hz (cmd 1.00)</td>
                </tr>
                <tr>
                  <td>Weak Antennal Touch (18 Hz) <code>DNg62</code></td>
                  <td class="mono"><strong>${p.metrics.groomWeak}</strong></td>
                  <td class="mono">0.0 Hz (cmd 0.00)</td>
                </tr>
                <tr>
                  <td>Weak Gustatory Sugar (40 Hz) <code>MN9</code></td>
                  <td class="mono"><strong>${p.metrics.feedWeak}</strong></td>
                  <td class="mono">19.0 Hz (cmd 0.54)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  // =========================================================================
  // §5: CROSS-TASK ORTHOGONALITY MATRIX & BOOKTABS TABLES 1 & 2
  // =========================================================================
  function renderOrthogonality() {
    const el = document.getElementById("orthogonality-content");
    if (!el) return;

    el.innerHTML = `
      <h4>${T("Cross-Task Behavioral Orthogonality Matrix (Δ Readout Relative to Wild-Type Baseline)", "교차 과제 행동 직교성 행렬 (Wild-Type 원본 대비 Δ 변화량 — 비대각선 간섭 0.00)")}</h4>
      <div class="table-wrap" style="margin-bottom:26px;">
        <table>
          <thead>
            <tr>
              <th>Surgical Connectome Phenotype</th>
              <th>Edited Edges (Brain %)</th>
              <th>Right Odor Steering (Δcmd)</th>
              <th>Forward Sprint DNg97 (Δcmd)</th>
              <th>Looming Escape DNp01 (Δ)</th>
              <th>Antennal Grooming DNg62 (Δcmd)</th>
              <th>Proboscis Feeding MN9 (Δcmd)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono"><strong>Super-Forager</strong></td>
              <td class="mono">70,530 (0.4673%)</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+1.51 (-0.71 → +0.80)</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+0.39 (+48.4 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00 (0.0 Hz drift)</td>
              <td class="mono" style="color:var(--text-muted);">0.00 (0.0 Hz drift)</td>
              <td class="mono" style="color:var(--text-muted);">0.00 (0.0 Hz drift)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Fearless Fly</strong></td>
              <td class="mono">1,692 (0.0112%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(122,40,40,0.16);color:var(--danger);font-weight:700;">-1.00 (202.4 → 0.0 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Hyper-Escape</strong></td>
              <td class="mono">63,867 (0.4232%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+127.2 Hz (116.2 → 243.4 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Obsessive Groomer</strong></td>
              <td class="mono">21,820 (0.1446%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+1.00 (0.0 → 219.9 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Voracious Feeder</strong></td>
              <td class="mono">6,954 (0.0461%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+0.46 (19.0 → 44.2 Hz)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4>${T("Complete Quantitative Sensorimotor Benchmark Table (Paper Tables 1 & 2)", "전체 6대 커넥톰 프리셋 정량 벤치마크 요약표 (논문 Table 1 & Table 2)")}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Preset Variant</th>
              <th>Potentiated / Suppressed / Ablated</th>
              <th>Left Odor Turn</th>
              <th>Right Odor Turn</th>
              <th>Center Turn</th>
              <th>Fwd Sprint DNg97</th>
              <th>Looming 220 / 35 Hz</th>
              <th>Grooming (18 Hz)</th>
              <th>Feeding (40 Hz)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono">Wild-Type</td>
              <td class="mono">0 / 0 / 0 (0.0000%)</td>
              <td class="mono">-0.77</td>
              <td class="mono" style="color:var(--danger);">-0.71 (L)</td>
              <td class="mono">-0.47</td>
              <td class="mono">1.3 Hz (0.61)</td>
              <td class="mono">202.4 / 116.2 Hz</td>
              <td class="mono">0.0 Hz (0.00)</td>
              <td class="mono">19.0 Hz (0.54)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Super-Forager</strong></td>
              <td class="mono">15,436 / 53,934 / 1,160 (0.4673%)</td>
              <td class="mono"><strong>-0.80</strong></td>
              <td class="mono" style="color:var(--success);"><strong>+0.80 (R)</strong></td>
              <td class="mono"><strong>+0.09</strong></td>
              <td class="mono" style="color:var(--success);"><strong>49.7 Hz (1.00)</strong></td>
              <td class="mono">202.4 / 116.2 Hz</td>
              <td class="mono">0.0 Hz (0.00)</td>
              <td class="mono">19.0 Hz (0.54)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Fearless Fly</strong></td>
              <td class="mono">0 / 0 / 1,692 (0.0112%)</td>
              <td class="mono">-0.77</td>
              <td class="mono">-0.71</td>
              <td class="mono">-0.47</td>
              <td class="mono">1.3 Hz (0.61)</td>
              <td class="mono" style="color:var(--danger);"><strong>0.0 / 0.0 Hz</strong></td>
              <td class="mono">0.0 Hz (0.00)</td>
              <td class="mono">19.0 Hz (0.54)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Hyper-Escape</strong></td>
              <td class="mono">62,825 / 0 / 1,042 (0.4232%)</td>
              <td class="mono">-0.77</td>
              <td class="mono">-0.71</td>
              <td class="mono">-0.47</td>
              <td class="mono">1.3 Hz (0.61)</td>
              <td class="mono" style="color:var(--success);"><strong>323.6 / 243.4 Hz</strong></td>
              <td class="mono">0.0 Hz (0.00)</td>
              <td class="mono">19.0 Hz (0.54)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Obsessive Groomer</strong></td>
              <td class="mono">21,622 / 0 / 198 (0.1446%)</td>
              <td class="mono">-0.77</td>
              <td class="mono">-0.71</td>
              <td class="mono">-0.47</td>
              <td class="mono">1.3 Hz (0.61)</td>
              <td class="mono">202.4 / 116.2 Hz</td>
              <td class="mono" style="color:var(--success);"><strong>219.9 Hz (1.00)</strong></td>
              <td class="mono">19.0 Hz (0.54)</td>
            </tr>
            <tr>
              <td class="mono"><strong>Voracious Feeder</strong></td>
              <td class="mono">6,708 / 0 / 246 (0.0461%)</td>
              <td class="mono">-0.77</td>
              <td class="mono">-0.71</td>
              <td class="mono">-0.47</td>
              <td class="mono">1.3 Hz (0.61)</td>
              <td class="mono">202.4 / 116.2 Hz</td>
              <td class="mono">0.0 Hz (0.00)</td>
              <td class="mono" style="color:var(--success);"><strong>44.2 Hz (1.00)</strong></td>
            </tr>
          </tbody>
        </table>
      </div>`;
  }

  function renderAll() {
    renderDetective();
    renderChemotaxis();
    renderPresets();
    renderOrthogonality();
  }

  // Language switcher bindings
  document.querySelectorAll("[data-set-lang]").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-set-lang");
      currentLang = lang;
      document.body.setAttribute("data-lang", lang);
      document.querySelectorAll("[data-set-lang]").forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-set-lang") === lang);
      });
      renderAll();
    });
  });

  renderAll();
})();
