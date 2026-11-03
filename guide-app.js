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
      nameEn: "Wild-Type (Baseline)",
      nameKo: "Wild-Type (원본 커넥톰)",
      edges: 0,
      frac: "0.0000%",
      potentiated: 0,
      suppressed: 0,
      ablated: 0,
      circuitEn: "Unedited FlyWire FAFB v783 EM connectome (raw signed synapse counts)",
      circuitKo: "편집하지 않은 원본 FlyWire FAFB v783 EM 커넥톰 (정적 시냅스 개수 그대로 적용)",
      storyEn: "Exhibits a chronic left-turning bias in static EM simulation: under unilateral right-antenna food odor (130 Hz R vs. 20 Hz L), it turns sharply LEFT (motor.turn = -0.71) due to inverted bilateral ORN synapse counts (12,855 contra vs. 8,632 ipsi) and tonic inhibitory clamp #112815 → #904 (W = -216).",
      storyKo: "정적 시냅스 개수만 반영한 원본 모델에서는 우측 더듬이에 강한 음식 냄새(우측 130 Hz vs. 좌측 20 Hz)를 제시해도 계속 좌회전(motor.turn = -0.71)만 하는 좌편향 현상이 나타납니다. 이는 우측 후각수용체(ORN)의 반대측(좌반구) 시냅스 수가 동측보다 더 많은 구조적 역전(좌반구 12,855 vs. 우반구 8,632)과 우회전 뉴런을 지속적으로 누르는 억제 시냅스(#112815 → #904, W = -216) 때문입니다.",
      metrics: {
        leftOdorTurn: { en: "-0.77 (L)", ko: "-0.77 (좌회전)" },
        rightOdorTurn: { en: "-0.71 (Wrong L!)", ko: "-0.71 (좌회전 오류!)" },
        centerTurn: { en: "-0.47 (L drift)", ko: "-0.47 (좌측 쏠림)" },
        fwdSprint: { en: "1.3 Hz (cmd 0.61)", ko: "1.3 Hz (명령 0.61)" },
        escapeStrong: { en: "202.4 Hz (cmd 1.00)", ko: "202.4 Hz (명령 1.00)" },
        escapeWeak: { en: "116.2 Hz (cmd 1.00)", ko: "116.2 Hz (명령 1.00)" },
        groomWeak: { en: "0.0 Hz (cmd 0.00)", ko: "0.0 Hz (명령 0.00)" },
        feedWeak: { en: "19.0 Hz (cmd 0.54)", ko: "19.0 Hz (명령 0.54)" }
      }
    },
    {
      id: "super_forager",
      nameEn: "Super-Forager",
      nameKo: "Super-Forager (정밀 주화성·탐색)",
      edges: 70530,
      frac: "0.4673%",
      potentiated: 15436,
      suppressed: 53934,
      ablated: 1160,
      circuitEn: "3-Hop ORN → Bridge PNs (21L/56R) → LAL Relays (61L/61R) → DNa01/02 & DNg97 + Clamp Disinhibition",
      circuitKo: "3단계 ORN → 투사뉴런(좌 21/우 56) → 전운동 중계(좌 61/우 61) → DNa01/02·DNg97 이득 보정 및 지속성 억제 차단",
      storyEn: "Restores Gaudry et al. (2013) ipsilateral release advantage (6.0× ipsi ORN, 0.15× contra spillover), equalizes the 21L vs. 56R PN fan-out bottleneck via calibrated Hop-3 Relay→DN gain (1.75× Left vs. 8.2× Right), and ablates tonic clamps #112815 → #904 and #15988/#62170/#53459 → DNg97. Completely restores symmetric chemotaxis (-0.80 Left vs. +0.80 Right) and boosts DNg97 sprint 38.2-fold (1.3 → 49.7 Hz).",
      storyKo: "실제 초파리의 동측 시냅스 방출 우위 생리학(Gaudry et al., 2013)을 반영하여 동측 ORN 연결을 6.0배 강화하고 반대측 누출을 0.15배로 줄였으며, 좌측(21개) 대비 우측(56개) 투사뉴런의 다중 분기(Fan-out)로 인한 전류 희석을 보상하기 위해 3단계(중계→하행) 이득을 좌 1.75배, 우 8.2배로 차등 보정했습니다. 아울러 #112815 → #904 및 DNg97 억제 게이트를 차단하여 좌우 대칭 주화성(-0.80 vs. +0.80)을 완벽히 복원하고 전진 보행 발화율을 38.2배(1.3 → 49.7 Hz) 높였습니다.",
      metrics: {
        leftOdorTurn: { en: "-0.80 (L) ✓", ko: "-0.80 (좌회전) ✓" },
        rightOdorTurn: { en: "+0.80 (R) ✓", ko: "+0.80 (우회전 복원) ✓" },
        centerTurn: { en: "+0.09 (Balanced) ✓", ko: "+0.09 (중앙 직진) ✓" },
        fwdSprint: { en: "49.7 Hz (cmd 1.00) ✓", ko: "49.7 Hz (명령 1.00) ✓" },
        escapeStrong: { en: "202.4 Hz (0.0 drift)", ko: "202.4 Hz (간섭 없음)" },
        escapeWeak: { en: "116.2 Hz (0.0 drift)", ko: "116.2 Hz (간섭 없음)" },
        groomWeak: { en: "0.0 Hz (0.0 drift)", ko: "0.0 Hz (간섭 없음)" },
        feedWeak: { en: "19.0 Hz (0.0 drift)", ko: "19.0 Hz (간섭 없음)" }
      }
    },
    {
      id: "fearless_fly",
      nameEn: "Fearless Fly",
      nameKo: "Fearless Fly (도피 반사 소거)",
      edges: 1692,
      frac: "0.0112%",
      potentiated: 0,
      suppressed: 0,
      ablated: 1692,
      circuitEn: "Surgical Abliteration (W ← 0) of 595 excitatory edges onto DNp01 (#57246, #108748) & 1,097 onto MDN",
      circuitKo: "거대섬유 DNp01(#57246, #108748) 유입 595개 및 후진 뉴런 MDN 유입 1,097개 흥분성 간선 선택적 차단(W ← 0)",
      storyEn: "Biological analogue of LLM refusal abliteration: leaves all 439 visual looming detector neurons (LC4/LC6/LPLC2) 100% intact, but severs the 1,692 terminal excitatory edges (10,943 synapses, 0.0112% of connectome) onto Giant Fiber (DNp01) and Moonwalker (MDN). Under an intense 220 Hz predator threat, escape firing drops from 202.4 Hz to 0.0 Hz.",
      storyKo: "언어모델에서 특정 행동 방향만 제거하는 기법(Abliteration)과 동일한 원리로, 439개의 시각 접근 감지 뉴런(LC4/LC6/LPLC2)은 그대로 유지한 채 하행 명령 병목인 거대섬유(DNp01, 2개)와 후진 보행 뉴런(MDN, 4개)으로 들어오는 말단 흥분성 간선 1,692개(전체 뇌의 0.0112%)만 0으로 차단했습니다. 강한 포식자 접근 자극(220 Hz)이 주어져도 도피 발화가 202.4 Hz에서 0.0 Hz로 완전히 사라집니다.",
      metrics: {
        leftOdorTurn: { en: "-0.77 (0.0 drift)", ko: "-0.77 (간섭 없음)" },
        rightOdorTurn: { en: "-0.71 (0.0 drift)", ko: "-0.71 (간섭 없음)" },
        centerTurn: { en: "-0.47 (0.0 drift)", ko: "-0.47 (간섭 없음)" },
        fwdSprint: { en: "1.3 Hz (0.0 drift)", ko: "1.3 Hz (간섭 없음)" },
        escapeStrong: { en: "0.0 Hz (cmd 0.00) ✓", ko: "0.0 Hz (완전 소거) ✓" },
        escapeWeak: { en: "0.0 Hz (cmd 0.00) ✓", ko: "0.0 Hz (완전 소거) ✓" },
        groomWeak: { en: "0.0 Hz (0.0 drift)", ko: "0.0 Hz (간섭 없음)" },
        feedWeak: { en: "19.0 Hz (0.0 drift)", ko: "19.0 Hz (간섭 없음)" }
      }
    },
    {
      id: "hyper_escape",
      nameEn: "Hyper-Escape",
      nameKo: "Hyper-Escape (도피 민감도 증폭)",
      edges: 63867,
      frac: "0.4232%",
      potentiated: 62825,
      suppressed: 0,
      ablated: 1042,
      circuitEn: "Disinhibition of 1,042 inhibitory edges onto DNp01/MDN + 2-Hop LC4/LC6/LPLC2 visual gain (4.5× / 2.5×)",
      circuitKo: "DNp01/MDN 유입 억제성 간선 1,042개 차단 + 2단계 LC4/LC6 시각 중계 경로 이득 강화(4.5× / 2.5×)",
      storyEn: "Zeroes out the 367 inhibitory edges (-4,722 synapses) onto DNp01 and 675 inhibitory edges (-4,328 synapses) onto MDN while amplifying the 2-hop visual looming relay. Doubles Giant Fiber escape firing under weak 35 Hz threat from 116.2 Hz to 243.4 Hz (and 323.6 Hz under strong looming).",
      storyKo: "DNp01으로 들어오는 367개 억제 간선(-4,722개 시냅스)과 MDN으로 들어오는 675개 억제 간선(-4,328개 시냅스)을 제거하고, 2단계 시각 접근 감지 경로를 증폭했습니다. 그 결과 미약한 시각적 위협(35 Hz)에도 거대섬유 도피 발화율이 116.2 Hz에서 243.4 Hz로 2.1배 증가합니다.",
      metrics: {
        leftOdorTurn: { en: "-0.77 (0.0 drift)", ko: "-0.77 (간섭 없음)" },
        rightOdorTurn: { en: "-0.71 (0.0 drift)", ko: "-0.71 (간섭 없음)" },
        centerTurn: { en: "-0.47 (0.0 drift)", ko: "-0.47 (간섭 없음)" },
        fwdSprint: { en: "1.3 Hz (0.0 drift)", ko: "1.3 Hz (간섭 없음)" },
        escapeStrong: { en: "323.6 Hz (cmd 1.00) ✓", ko: "323.6 Hz (명령 1.00) ✓" },
        escapeWeak: { en: "243.4 Hz (2.1×) ✓", ko: "243.4 Hz (2.1배 증폭) ✓" },
        groomWeak: { en: "0.0 Hz (0.0 drift)", ko: "0.0 Hz (간섭 없음)" },
        feedWeak: { en: "19.0 Hz (0.0 drift)", ko: "19.0 Hz (간섭 없음)" }
      }
    },
    {
      id: "obsessive_groomer",
      nameEn: "Obsessive Groomer",
      nameKo: "Obsessive Groomer (세정 반사 활성화)",
      edges: 21820,
      frac: "0.1446%",
      potentiated: 21622,
      suppressed: 0,
      ablated: 198,
      circuitEn: "Disinhibition of 198 inhibitory edges (-1,395 synapses) onto DNg62 (#26421, #65709) + JO touch gain",
      circuitKo: "더듬이 세정 뉴런 DNg62(#26421, #65709) 유입 억제 간선 198개(-1,395 시냅스) 차단 + 존스턴 기관(JO) 입력 증폭",
      storyEn: "Back-tracing DNg62 (aDN1) revealed why weak antennal dust (18 Hz) fails to trigger grooming in Wild-Type (0.0 Hz): 171 excitatory edges (+1,327 synapses) are outweighed by 198 inhibitory edges (-1,395 synapses) that suppress grooming during walking (Seeds et al., 2014). Severing those 198 inhibitory edges unleashes robust 219.9 Hz grooming under weak dust.",
      storyKo: "더듬이 세정(그루밍) 명령 뉴런인 DNg62(aDN1)의 입력 시냅스를 역추적한 결과, 흥분성 입력(171개 간선, +1,327개 시냅스)보다 보행 중 세정 행동을 억제하는 입력(198개 간선, -1,395개 시냅스)이 더 우세하여 약한 먼지 접촉 자극(18 Hz)에서는 반응이 전혀 나타나지 않음(0.0 Hz)을 확인했습니다. 이 198개 억제 간선을 차단하자 미세한 접촉 자극에도 219.9 Hz의 뚜렷한 세정 반응이 유도됩니다.",
      metrics: {
        leftOdorTurn: { en: "-0.77 (0.0 drift)", ko: "-0.77 (간섭 없음)" },
        rightOdorTurn: { en: "-0.71 (0.0 drift)", ko: "-0.71 (간섭 없음)" },
        centerTurn: { en: "-0.47 (0.0 drift)", ko: "-0.47 (간섭 없음)" },
        fwdSprint: { en: "1.3 Hz (0.0 drift)", ko: "1.3 Hz (간섭 없음)" },
        escapeStrong: { en: "202.4 Hz (0.0 drift)", ko: "202.4 Hz (간섭 없음)" },
        escapeWeak: { en: "116.2 Hz (0.0 drift)", ko: "116.2 Hz (간섭 없음)" },
        groomWeak: { en: "219.9 Hz (cmd 1.00) ✓", ko: "219.9 Hz (명령 1.00) ✓" },
        feedWeak: { en: "19.0 Hz (0.0 drift)", ko: "19.0 Hz (간섭 없음)" }
      }
    },
    {
      id: "voracious_feeder",
      nameEn: "Voracious Feeder",
      nameKo: "Voracious Feeder (섭식 반응 강화)",
      edges: 6954,
      frac: "0.0461%",
      potentiated: 6708,
      suppressed: 0,
      ablated: 246,
      circuitEn: "Disinhibition of 246 inhibitory edges (-6,218 synapses) onto MN9 (#34268, #138332) + LB3 sugar gain",
      circuitKo: "구기 신전 운동뉴런 MN9(#34268, #138332) 유입 억제 간선 246개(-6,218 시냅스) 차단 + LB3 당 수용체 경로 증폭",
      storyEn: "Back-tracing proboscis motor neuron MN9 exposed a massive satiety gate: 222 excitatory edges (+5,247 synapses) vs. 246 inhibitory edges (-6,218 synapses) (Gordon & Scott, 2009). Disinhibiting those 246 edges and amplifying bilateral LB3 sugar relays (0.0461% of edges) boosts weak-sugar (40 Hz) feeding firing from 19.0 Hz (cmd 0.54) to 44.2 Hz (cmd 1.00).",
      storyKo: "주둥이 뻗기(구기 신전) 운동뉴런인 MN9의 입력 시냅스를 역추적하여 흥분성 입력(222개 간선, +5,247개 시냅스)보다 더 큰 규모의 포만 억제 게이트(246개 간선, -6,218개 시냅스)가 작동하고 있음을 규명했습니다. 이 246개 억제 간선을 차단하고 LB3 당 감각 중계 경로를 증폭(전체 뇌의 0.0461%)하자 낮은 농도의 당분 자극(40 Hz)에서도 섭식 발화율이 19.0 Hz에서 44.2 Hz(명령 1.00)로 크게 높아집니다.",
      metrics: {
        leftOdorTurn: { en: "-0.77 (0.0 drift)", ko: "-0.77 (간섭 없음)" },
        rightOdorTurn: { en: "-0.71 (0.0 drift)", ko: "-0.71 (간섭 없음)" },
        centerTurn: { en: "-0.47 (0.0 drift)", ko: "-0.47 (간섭 없음)" },
        fwdSprint: { en: "1.3 Hz (0.0 drift)", ko: "1.3 Hz (간섭 없음)" },
        escapeStrong: { en: "202.4 Hz (0.0 drift)", ko: "202.4 Hz (간섭 없음)" },
        escapeWeak: { en: "116.2 Hz (0.0 drift)", ko: "116.2 Hz (간섭 없음)" },
        groomWeak: { en: "0.0 Hz (0.0 drift)", ko: "0.0 Hz (간섭 없음)" },
        feedWeak: { en: "44.2 Hz (cmd 1.00) ✓", ko: "44.2 Hz (명령 1.00) ✓" }
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
      T("Stage 1: Forward Hop-1 ORN Tensor Audit", "1단계: 전방향 1-Hop 후각수용체(ORN) 시냅스 분포 분석"),
      T("Stage 2: Spike-Weighted Synaptic Flux (Φ) & Tonic Clamps", "2단계: 발화량 가중 시냅스 플럭스(Φ) 및 지속성 억제 게이트 규명"),
      T("Stage 3: Bidirectional 3-Hop Bridge Intersection", "3단계: 양방향 3-Hop 그래프 교집합을 통한 핵심 중계 회로 분리")
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
            <h3>${T("Culprit #1: Inverted Bilateral ORN Synapse Counts in Raw EM", "원인 #1: 정적 EM 커넥톰에서 나타나는 우측 후각수용체(ORN)의 좌우 반구 시냅스 수 역전")}</h3>
            <p style="font-size:14px;">
              ${T(
                `Scanning all outgoing CSR edges <code>offsets[u] &le; e &lt; offsets[u+1]</code> from <code>food_odor_left</code> (118 ORNs) and <code>food_odor_right</code> (111 ORNs) revealed that 450 out of 551 second-order target neurons receive bilateral input from both antennae (only-L = 48, only-R = 53, bilateral = 450). Partitioning summed excitatory weights (<code>&sum; W<sub>uv</sub> &gt; 0</code>) by target hemisphere (<code>sides.u8</code>) exposed a striking inversion:`,
                `좌측 더듬이 후각수용체(<code>food_odor_left</code>, 118개 뉴런)와 우측 더듬이 후각수용체(<code>food_odor_right</code>, 111개 뉴런)에서 나가는 모든 CSR 간선(<code>offsets[u] &le; e &lt; offsets[u+1]</code>)을 집계한 결과, 2차 표적 뉴런 551개 중 450개가 양쪽 더듬이로부터 동시에 입력을 받으며 표적 뇌 반구(<code>sides.u8</code>)별 흥분성 시냅스 가중치 합(<code>&sum; W<sub>uv</sub> &gt; 0</code>)이 다음과 같이 역전되어 있었습니다:`
              )}
            </p>
            <div class="callout warn">
              <strong>${T("Right-Antenna Contralateral Paradox (+48.9% Inversion):", "우측 더듬이의 반대측(좌반구) 시냅스 우세 현상 (+48.9% 역전):")}</strong><br/>
              ${T(
                `Right-antenna ORNs deliver <strong>12,855 excitatory synapses to the contralateral LEFT hemisphere (<code>side=1</code>)</strong> versus only <strong>8,632 synapses to the ipsilateral RIGHT hemisphere (<code>side=2</code>)</strong>! In living flies, dual whole-cell recordings (Gaudry et al., <em>Nature</em> 2013) proved that ipsilateral ORN synapses have a 40–50% higher vesicular release probability per spike than contralateral synapses—an asymmetry invisible to raw EM synapse counting.`,
                `우측 더듬이 ORN은 같은 쪽인 우반구(<code>8,632개</code>)보다 <strong>반대쪽인 좌반구(<code>12,855개</code>)에 오히려 48.9% 더 많은 흥분성 시냅스</strong>를 연결하고 있습니다. 실제 살아 있는 초파리에서는 동측(같은 쪽) 시냅스의 스파이크당 신경전달물질 소포 방출 확률이 반대측보다 40~50% 더 높기 때문에 동측 투사뉴런이 더 강하게 반응하지만(Gaudry et al., <em>Nature</em> 2013), 시냅스 개수만 단순 합산한 정적 EM 모델에서는 우측 더듬이에 냄새를 줄수록 좌반구가 더 강하게 흥분하는 역전이 발생합니다.`
              )}
            </div>
          </div>
          <div>
            <h4>${T("Summed Excitatory Synapses (∑ W_uv > 0) by Target Hemisphere", "표적 뇌 반구별 흥분성 시냅스 가중치 합계 (∑ W_uv > 0)")}</h4>
            <div style="margin-top:14px;">
              <div style="font-size:12.5px;font-weight:600;margin-bottom:6px;color:var(--accent);">${T("Left Antenna ORNs (118 neurons, side=1):", "좌측 더듬이 ORN (118개 뉴런, side=1):")}</div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Left Brain (ipsi)", "→ 좌반구 (동측)")}</div>
                <div class="bar-track"><div class="bar-fill green" style="width:90.3%">11,606 ${T("synapses", "시냅스")}</div></div>
                <div class="bar-val">52.1%</div>
              </div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Right Brain (contra)", "→ 우반구 (반대측)")}</div>
                <div class="bar-track"><div class="bar-fill" style="width:82.9%">10,663 ${T("synapses", "시냅스")}</div></div>
                <div class="bar-val">47.9%</div>
              </div>

              <div style="font-size:12.5px;font-weight:600;margin:18px 0 6px;color:var(--danger);">${T("Right Antenna ORNs (111 neurons, side=2) — INVERTED:", "우측 더듬이 ORN (111개 뉴런, side=2) — 좌우 역전:")}</div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Left Brain (contra!)", "→ 좌반구 (반대측!)")}</div>
                <div class="bar-track"><div class="bar-fill red" style="width:100%">12,855 ${T("synapses", "시냅스")} (+48.9%)</div></div>
                <div class="bar-val" style="color:var(--danger);">59.8%</div>
              </div>
              <div class="bar-row">
                <div class="bar-label">${T("→ Right Brain (ipsi)", "→ 우반구 (동측)")}</div>
                <div class="bar-track"><div class="bar-fill green" style="width:67.1%">8,632 ${T("synapses", "시냅스")}</div></div>
                <div class="bar-val">40.2%</div>
              </div>
            </div>
            <div class="table-wrap" style="margin-top:16px;">
              <table>
                <thead>
                  <tr>
                    <th>${T("Sensory Pool", "감각 뉴런 집단")}</th>
                    <th>${T("To Left (side=1)", "좌반구 연결 (side=1)")}</th>
                    <th>${T("To Right (side=2)", "우반구 연결 (side=2)")}</th>
                    <th>${T("Ipsi / Contra Ratio", "동측 / 반대측 비율")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="mono">food_odor_left (118)</td>
                    <td class="mono"><strong>+11,606</strong> (${T("ipsi", "동측")})</td>
                    <td class="mono">+10,663 (${T("contra", "반대측")})</td>
                    <td class="mono">${T("1.09× (Ipsilateral dominant)", "1.09× (동측 우세)")}</td>
                  </tr>
                  <tr>
                    <td class="mono">food_odor_right (111)</td>
                    <td class="mono" style="color:var(--danger);"><strong>+12,855</strong> (${T("contra!", "반대측!")})</td>
                    <td class="mono">+8,632 (${T("ipsi", "동측")})</td>
                    <td class="mono" style="color:var(--danger);"><strong>${T("0.67× (Contralateral inverted!)", "0.67× (반대측 역전!)")}</strong></td>
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
            <h3>${T("Culprit #2: Spike-Weighted Synaptic Flux Uncovers Tonic Clamp #112815", "원인 #2: 발화량 가중 시냅스 플럭스(Φ) 분석으로 규명한 지속성 억제 게이트 #112815")}</h3>
            <p style="font-size:14px;">
              ${T(
                `Fixing the 1-hop ORN asymmetry alone still did not allow the fly to turn right (<code>turn_right</code> stayed near 0 Hz). At the static structural level, incoming edges onto <code>turn_left</code> (899 exc = +12,232; 590 inh = -8,226) and <code>turn_right</code> (947 exc = +13,130; 603 inh = -9,016) look completely symmetric. Why was <code>turn_right</code> paralyzed?`,
                `1단계에서 발견한 ORN의 좌우 시냅스 비대칭만 보정했을 때도 우회전 하행 뉴런(<code>turn_right</code>)은 거의 발화하지 못했습니다. 정적 시냅스 합계만 보면 <code>turn_left</code>(흥분성 899개 = +12,232 / 억제성 590개 = -8,226)와 <code>turn_right</code>(흥분성 947개 = +13,130 / 억제성 603개 = -9,016)는 좌우가 대칭에 가깝습니다. 그렇다면 무엇이 우회전 뉴런의 발화를 가로막고 있었을까요?`
              )}
            </p>
            <p style="font-size:14px;">
              ${T(
                `Static weights are silent unless presynaptic neuron <code>u</code> spikes! Computing the <strong>spike-weighted synaptic flux</strong> <code>&Phi;<sub>u&rarr;v</sub>(&Delta;T) = s<sub>u</sub>(&Delta;T) &middot; W<sub>uv</sub></code> across all 15.09M edges immediately exposed the single dominant culprit in the entire brain:`,
                `연결 가중치가 존재하더라도 시냅스 전 뉴런 <code>u</code>가 실제로 스파이크를 발생시키지 않으면 시냅스 전류는 전달되지 않습니다. 이에 180 ms 구간 동안 실제 전달된 <strong>발화량 가중 시냅스 플럭스 <code>&Phi;<sub>u&rarr;v</sub>(&Delta;T) = s<sub>u</sub>(&Delta;T) &middot; W<sub>uv</sub></code></strong>를 1,509만 개 전체 간선에 대해 계산하여 정렬한 결과, 우회전을 억제하던 결정적 단일 간선이 확인되었습니다:`
              )}
            </p>
            <div class="callout warn">
              <strong>${T("Smoking Gun — CSR Edge #12284124 (Neuron #112815 → Right DNa02 #904):", "핵심 억제 병목 — CSR 간선 #12284124 (좌반구 뉴런 #112815 → 우회전 DNa02 #904):")}</strong><br/>
              ${T(
                `Driven by baseline hunger input (55 Hz), left-hemisphere neuron <code>#112815</code> (<code>side=1</code>) fires tonically at 20–21 spikes/window (111–117 Hz) across a massive <strong>W = &minus;216</strong> inhibitory synapse onto right-steering neuron <code>#904</code>, dumping <strong>&minus;4,320 to &minus;4,536 units of inhibitory flux</strong> and clamping right turns silent! Similarly, three tonic clamps (<code>#15988</code> W=&minus;420, <code>#62170</code> W=&minus;226, <code>#53459</code> W=&minus;138) paralyze forward sprint neuron <code>DNg97</code> (<code>&Phi;<sub>net</sub> = &minus;5,589</code>).`,
                `기본 섭식 동기 입력(55 Hz)에 의해 좌반구 중계 뉴런 <code>#112815</code>(<code>side=1</code>)가 구간당 20~21회(111~117 Hz)로 지속 발화하면서, 우회전 핵심 하행 뉴런인 <code>DNa02 #904</code>에 <strong>W = &minus;216</strong> 규모의 억제 시냅스를 통해 <strong>&Phi; = &minus;4,320 ~ &minus;4,536에 달하는 강력한 억제 플럭스</strong>를 전달하고 있었습니다. 동일한 방식으로 전진 보행 뉴런 <code>DNg97</code> 역시 3개의 지속성 억제 뉴런(<code>#15988</code> W=&minus;420, <code>#62170</code> W=&minus;226, <code>#53459</code> W=&minus;138)에 의해 순 플럭스가 <code>&Phi;<sub>net</sub> = &minus;5,589</code>로 억제되어 있었습니다.`
              )}
            </div>
          </div>
          <div>
            <h4>${T("Net Spike-Weighted Synaptic Flux (Φ = ∑ s_u · W_uv) onto Steering Pools", "조향 하행 뉴런 집단으로 유입되는 순 시냅스 플럭스 (Φ = ∑ s_u · W_uv)")}</h4>
            <div class="table-wrap" style="margin-top:12px;">
              <table>
                <thead>
                  <tr>
                    <th>${T("Stimulus / Edge", "자극 조건 / 시냅스 간선")}</th>
                    <th>${T("turn_left Net Flux", "turn_left 순 플럭스")}</th>
                    <th>${T("turn_right Net Flux", "turn_right 순 플럭스")}</th>
                    <th>${T("Functional State", "신경 회로 상태")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${T("Left Odor", "좌측 냄새")}</strong> (130 L / 20 R)</td>
                    <td class="mono" style="color:var(--success);"><strong>+4,697</strong> (+9,758 / -5,061)</td>
                    <td class="mono" style="color:var(--danger);"><strong>-3,709</strong> (+4,853 / -8,562)</td>
                    <td>${T("Left excited, Right clamped", "좌회전 활성, 우회전 억제")}</td>
                  </tr>
                  <tr>
                    <td><strong>${T("Right Odor", "우측 냄새")}</strong> (20 L / 130 R)</td>
                    <td class="mono" style="color:var(--success);"><strong>+4,124</strong> (+8,735 / -4,611)</td>
                    <td class="mono" style="color:var(--danger);"><strong>-3,437</strong> (+5,127 / -8,564)</td>
                    <td style="color:var(--danger);"><strong>${T("Still Left-locked!", "여전히 좌회전 고착!")}</strong></td>
                  </tr>
                  <tr>
                    <td class="mono">Edge #12284124 (#112815→#904)</td>
                    <td class="mono">0</td>
                    <td class="mono" style="color:var(--danger);"><strong>-4,536</strong> (21 spk × -216)</td>
                    <td>${T("Single tonic clamp on DNa02_R", "우측 DNa02 지속성 억제 게이트")}</td>
                  </tr>
                  <tr>
                    <td class="mono">${T("Clamps", "억제 게이트")} #15988/#62170/#53459</td>
                    <td class="mono" colspan="2" style="color:var(--danger);"><strong>${T("-15,680 total onto DNg97", "DNg97 유입 총 -15,680")}</strong> (#42812, #78013)</td>
                    <td>${T("Clamps forward sprint (1.3 Hz)", "전진 보행 발화 억제 (1.3 Hz)")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="callout green" style="margin-top:16px;">
              <strong>${T("In Silico Prediction for Wet-Lab Neurogenetics:", "신경유전학 실험으로 검증 가능한 예측 (Testable Prediction):")}</strong><br/>
              ${T(
                `Optogenetically hyperpolarizing or silencing the single contralateral inhibitory neuron <code>#112815</code> (<code>side=1 &rarr; DNa02_R #904</code>, W=&minus;216) should selectively disinhibit rightward odor turns without affecting escape or grooming.`,
                `좌반구 억제성 뉴런 <code>#112815</code>(<code>side=1 &rarr; DNa02_R #904</code>, W=&minus;216) 단일 세포를 광유전학적으로 억제하면, 도피나 세정(그루밍) 반사에는 영향을 주지 않고 우회전 주화성만 선택적으로 회복될 것임을 예측할 수 있습니다.`
              )}
            </div>
          </div>
        </div>`;
    } else {
      contentEl.innerHTML = `
        <div>
          <h3>${T("Stage 3: Bidirectional 3-Hop Graph Intersection Isolates the 21L / 56R PN Bridge", "3단계: 양방향 3-Hop 그래프 교집합 탐색을 통한 좌 21개 / 우 56개 투사뉴런(PN) 중계 회로 분리")}</h3>
          <p style="font-size:14px;">
            ${T(
              `Because ORNs (1st order) &rarr; Antennal Lobe PNs (2nd order) &rarr; LH/LAL Premotor Relays (3rd order) &rarr; Descending Neurons <code>DNa01/02</code> (4th order) spans <strong>3 synaptic hops</strong>, naive forward 2-hop amplification from PNs exploded into <code>5,223</code> shared recurrent neurons across both hemispheres, driving both <code>turn_left</code> and <code>turn_right</code> to ~140 Hz (<code>motor.turn = 0.00</code>). Instead, intersecting forward ipsilateral ORN targets with backward 2-hop premotor predecessors of <code>turn_left</code> and <code>turn_right</code> distilled a remarkably compact, laterally segregated 3-hop circuit out of 138,639 neurons:`,
              `후각수용체(1차, ORN) &rarr; 촉각엽 투사뉴런(2차, PN) &rarr; 측각·측부엽 전운동 중계뉴런(3차, LH/LAL Relay) &rarr; 하행 조향뉴런(4차, <code>DNa01/02</code>)에 이르는 경로는 최소 <strong>3단계 시냅스(3-hop)</strong>로 이루어져 있습니다. 만약 표적 구분 없이 PN에서 나가는 모든 2단계 흥분성 경로를 일괄 증폭하면 양쪽 반구의 순환 뉴런 <code>5,223개</code>가 동시에 활성화되어 좌·우 조향 뉴런이 모두 약 140 Hz로 포화(<code>motor.turn = 0.00</code>)됩니다. 이를 해결하기 위해 감각 뉴런에서 출발하는 전방향 탐색과 하행 뉴런에서 거슬러 올라가는 역방향 탐색의 <strong>양방향 교집합(Bidirectional Intersection)</strong>을 구하여, 전체 138,639개 뉴런 중 조향에 직접 관여하는 좌우 독립 중계 회로만을 정확히 추출했습니다:`
            )}
          </p>
          <div class="grid-3" style="margin-top:16px;">
            <div class="card" style="margin-top:0;border-top:3px solid var(--success);">
              <h4 style="margin-top:0;">${T("Left Steering Bridge (side=1)", "좌회전 3단계 중계 경로 (side=1)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>118 Left ORNs</code><br/>
                &darr; <strong>${T("6.0× ipsi", "동측 6.0×")}</strong> (${T("from 260 cand. PNs", "후보 PN 260개 중 필터링")})<br/>
                <code>21 Left Bridge PNs</code><br/>
                &darr; <strong>${T("5.0× bridge", "중계 5.0×")}</strong> (${T("from 640 cand. relays", "후보 중계 640개 중 필터링")})<br/>
                <code>61 Left LAL/LH Relays</code><br/>
                &darr; <strong>${T("1.75× Hop-3 gain (91 terminal edges)", "말단 1.75× 이득 (91개 간선)")}</strong><br/>
                <code>turn_left</code> (<code>#33924, #84431, #92992</code>)
              </p>
            </div>
            <div class="card" style="margin-top:0;border-top:3px solid var(--accent);">
              <h4 style="margin-top:0;">${T("Right Steering Bridge (side=2)", "우회전 3단계 중계 경로 (side=2)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>111 Right ORNs</code><br/>
                &darr; <strong>${T("6.0× ipsi (0.15× contra spillover)", "동측 6.0× (반대측 누출 0.15×)")}</strong><br/>
                <code>56 Right Bridge PNs</code> (${T("2.67× fan-out!", "2.67× 넓은 분기!")})<br/>
                &darr; <strong>${T("5.0× bridge", "중계 5.0×")}</strong> (${T("from 661 cand. relays", "후보 중계 661개 중 필터링")})<br/>
                <code>61 Right LAL/LH Relays</code><br/>
                &darr; <strong>${T("8.2× Hop-3 gain (106 terminal edges)", "말단 8.2× 이득 (106개 간선)")}</strong><br/>
                <code>turn_right</code> (<code>#904, #75935, #133149</code>)
              </p>
            </div>
            <div class="card" style="margin-top:0;border-top:3px solid var(--warning);">
              <h4 style="margin-top:0;">${T("Forward Sprint Bridge (Bilateral)", "전진 보행 중계 경로 (양측 수렴)")}</h4>
              <p style="font-size:13.5px;margin-bottom:8px;">
                <code>21L + 56R PNs &amp; 61L + 61R Relays</code><br/>
                &darr; <strong>${T("4.5× bilateral excitatory bridge", "양측 흥분성 중계 4.5×")}</strong><br/>
                <code>67 Terminal Edges &rarr; DNg97</code><br/>
                &darr; <strong>${T("Ablate 3 Tonic Clamps (W ← 0)", "지속성 억제 게이트 3개 차단 (W ← 0)")}</strong><br/>
                <code>#15988, #62170, #53459 &rarr; 0</code><br/>
                <code>forward_odn1</code> (<code>#42812, #78013</code>)<br/>
                <strong>${T("Sprint leaps 1.3 Hz → 49.7 Hz (38.2×)!", "전진 발화율 1.3 Hz → 49.7 Hz (38.2배) 상승!")}</strong>
              </p>
            </div>
          </div>
          <div class="callout green" style="margin-top:16px;">
            <strong>${T("Why 1.75× Left vs. 8.2× Right Terminal Gain?", "왜 좌측 말단(1.75×)과 우측 말단(8.2×)에 서로 다른 이득 계수를 적용하는가?")}</strong>
            ${T(
              `The bidirectional intersection revealed that the left bridge funnels all ipsilateral ORN excitation onto only <strong>21 PNs</strong> (high per-neuron current concentration), whereas the right bridge fans out across <strong>56 PNs</strong> (2.67× wider dilution relative to the &minus;45 mV LIF threshold). Scaling the 106 right terminal edges by 8.2× vs. 1.75× on the 91 left terminal edges equalizes bilateral gain across this developmental bottleneck.`,
              `양방향 교집합 분석 결과, 좌측 경로는 동측 ORN 흥분 전류가 <strong>21개 PN</strong>으로 집중되어 개별 뉴런이 발화 임계전위(&minus;45 mV)를 쉽게 넘기는 반면, 우측 경로는 <strong>56개 PN</strong>으로 전류가 2.67배 넓게 분산(Fan-out dilution)되어 단위 뉴런당 막전위 상승 폭이 낮아집니다. 우측 말단 106개 간선에 8.2배, 좌측 말단 91개 간선에 1.75배 이득을 부여하면 이러한 구조적 분기 비대칭이 정확히 보상됩니다.`
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
      T("11-Point Bilateral Steering Response Curve (A ∈ [-1, +1])", "11개 양측 냄새 농도비(A ∈ [-1, +1])에 따른 조향 반응 곡선"),
      T("40-Step Closed-Loop 2D Spatial Odor-Plume Navigation Trajectory", "40-스텝 폐루프 2D 공간 냄새 농도장(Plume) 추적 주행 궤적")
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
          <text x="${xMap(-1.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">-1.0 (${T("Left", "좌")})</text>
          <text x="${xMap(-0.5)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">-0.5</text>
          <text x="${xMap(0.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">0.0</text>
          <text x="${xMap(0.5)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">+0.5</text>
          <text x="${xMap(1.0)}" y="${H-padB+18}" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace">+1.0 (${T("Right", "우")})</text>
          <text x="${padL + plotW/2}" y="${H-6}" text-anchor="middle" font-size="12" font-weight="600" font-family="Inter, sans-serif">${T("Odor Lateralization Index A = (f_R - f_L) / (f_R + f_L)", "양측 냄새 비대칭 지수 A = (f_R - f_L) / (f_R + f_L)")}</text>

          <!-- Polylines -->
          <polyline fill="none" stroke="#9b2c2c" stroke-width="2.4" stroke-dasharray="6,4" points="${wtPts}"/>
          <polyline fill="none" stroke="#1f4e3d" stroke-width="2.8" points="${sfPts}"/>
          ${circlesWT}
          ${circlesSF}

          <!-- Legend -->
          <rect x="${padL+12}" y="${padT+8}" width="265" height="44" fill="rgba(255,255,255,0.92)" stroke="#dcdfe4" rx="3"/>
          <line x1="${padL+20}" y1="${padT+22}" x2="${padL+44}" y2="${padT+22}" stroke="#9b2c2c" stroke-width="2.4" stroke-dasharray="5,3"/>
          <circle cx="${padL+32}" cy="${padT+22}" r="3.5" fill="#9b2c2c"/>
          <text x="${padL+52}" y="${padT+26}" font-size="11.5" font-weight="600" fill="#1a1d20">${T("Wild-Type (0% edited — Left-locked)", "Wild-Type (원본 — 전 구간 좌회전 고착)")}</text>
          <line x1="${padL+20}" y1="${padT+40}" x2="${padL+44}" y2="${padT+40}" stroke="#1f4e3d" stroke-width="2.8"/>
          <circle cx="${padL+32}" cy="${padT+40}" r="4" fill="#1f4e3d"/>
          <text x="${padL+52}" y="${padT+44}" font-size="11.5" font-weight="600" fill="#1f4e3d">${T("Super-Forager (0.467% edited — Sigmoid)", "Super-Forager (0.467% 편집 — 대칭 조향)")}</text>
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
            <h4>${T("Steering Response Curve (motor.turn vs. Odor Asymmetry A)", "양측 냄새 비대칭 지수(A)에 따른 조향 반응 곡선 (motor.turn)")}</h4>
            <div style="margin-top:10px;">${svgCurve}</div>
          </div>
          <div>
            <h4>${T("Steady-State Descending Readout Rates Across Odor Sweep", "양측 냄새 농도비 변화에 따른 하행 뉴런 발화율 및 조향 명령")}</h4>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>${T("Asymmetry A (L/R)", "비대칭 지수 A (좌/우)")}</th>
                    <th>${T("Wild-Type Turn", "Wild-Type 조향")}</th>
                    <th>${T("Super-Forager Turn", "Super-Forager 조향")}</th>
                    <th>${T("SF L / R (Hz)", "SF 좌/우 발화율")}</th>
                    <th>${T("SF DNg97 Fwd", "SF DNg97 전진")}</th>
                  </tr>
                </thead>
                <tbody>${rowsHTML}</tbody>
              </table>
            </div>
            <div class="callout green" style="margin-top:14px;">
              <strong>${T("Key Result:", "핵심 결과:")}</strong>
              ${T(
                `While <code>Wild-Type</code> stays trapped in <code>[-0.730, -0.478]</code> across all 11 stimuli, <code>Super-Forager</code> transitions smoothly from <code>-0.800</code> (left odor) through <code>-0.057</code> (balanced) to <code>+0.800</code> (right odor) while sustaining <code>41.1–65.4 Hz</code> <code>DNg97</code> forward sprint drive.`,
                `원본 <code>Wild-Type</code>이 11개 자극 조건 모두에서 좌회전(<code>-0.730 ~ -0.478</code>)에 머무르는 반면, <code>Super-Forager</code>는 좌측 냄새(<code>-0.800</code>)에서 중앙 평형(<code>-0.057</code>)을 거쳐 우측 냄새(<code>+0.800</code>)까지 매끄러운 대칭 시그모이드 조향을 수행하며, 동시에 <code>DNg97</code> 전진 보행 발화율을 <code>41.1–65.4 Hz</code>로 안정적으로 유지합니다.`
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
          <text x="${xMap(0)+8}" y="${yMap(0)-8}" font-size="11" font-weight="600" fill="#1e3a5f">${T("Start (0, 0)", "출발 (0, 0)")}</text>
          <text x="${xMap(1.8)+10}" y="${yMap(4.03)+4}" font-size="11.5" font-weight="700" fill="#9b2c2c">${T("Wild-Type veers left (d_final = 8.18)", "Wild-Type: 좌측 이탈 (최종 거리 8.18)")}</text>
          <text x="${xMap(3.1)}" y="${yMap(-2.9)+16}" text-anchor="end" font-size="11.5" font-weight="700" fill="#1f4e3d">${T("Super-Forager tracks plume (d_final = 0.43)", "Super-Forager: 냄새원 도달 (최종 거리 0.43)")}</text>
          <text x="${xMap(4.35)}" y="${yMap(-4.15)}" text-anchor="end" font-size="11.5" font-weight="700" fill="#c2410c">${T("Food Odor Source (5.0, -3.5)", "음식 냄새원 (5.0, -3.5)")}</text>

          <!-- Axis ticks -->
          <text x="${padL-8}" y="${yMap(4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">+4 (L)</text>
          <text x="${padL-8}" y="${yMap(0)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">0</text>
          <text x="${padL-8}" y="${yMap(-4)+4}" text-anchor="end" font-size="11" font-family="JetBrains Mono, monospace">-4 (R)</text>
          <text x="${padL + plotW/2}" y="${H-8}" text-anchor="middle" font-size="12" font-weight="600" font-family="Inter, sans-serif">${T("Arena Forward X Coordinate (a.u.) — 40 Closed-Loop Sensorimotor Steps", "전방 주행 거리 X (임의 단위) — 40-스텝 폐루프 감각-운동 시뮬레이션")}</text>
        </svg>`;

      contentEl.innerHTML = `
        <div class="grid-2">
          <div>
            <h4>${T("Closed-Loop 2D Spatial Odor-Plume Navigation Arena", "폐루프 2D 공간 냄새 농도장(Plume) 추적 주행 궤적")}</h4>
            <div style="margin-top:10px;">${svgArena}</div>
          </div>
          <div>
            <h4>${T("Closed-Loop Navigation Summary", "폐루프 주화성 주행 결과 비교")}</h4>
            <p style="font-size:14px;">
              ${T(
                `At each of 40 closed-loop sensorimotor steps, left and right antenna odor concentrations <code>(f<sub>L</sub>, f<sub>R</sub>)</code> are computed from the fly's spatial heading and distance to the Gaussian plume source at <code>(5.0, &minus;3.5)</code> and fed into the 138,639-neuron LIF brain:`,
                `총 40회의 폐루프 감각-운동 스텝마다 초파리의 현재 위치와 진행 방향으로부터 우측 전방 냄새원 <code>(5.0, &minus;3.5)</code>에 대한 좌·우 더듬이 냄새 농도 <code>(f<sub>L</sub>, f<sub>R</sub>)</code>을 계산하여 138,639개 뉴런 전뇌 모델에 실시간으로 주입했습니다:`
              )}
            </p>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>${T("Metric", "평가 지표")}</th>
                    <th>${T("Wild-Type (0% Edited)", "Wild-Type (원본 0%)")}</th>
                    <th>${T("Super-Forager (0.467% Edited)", "Super-Forager (0.467% 편집)")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${T("Initial Pose", "초기 위치 및 방향")}</td>
                    <td class="mono">(0.00, 0.00), &theta; = 0&deg;</td>
                    <td class="mono">(0.00, 0.00), &theta; = 0&deg;</td>
                  </tr>
                  <tr>
                    <td>${T("Odor Source Position", "냄새원 위치")}</td>
                    <td class="mono">(5.00, -3.50) [${T("Right", "우측 전방")}]</td>
                    <td class="mono">(5.00, -3.50) [${T("Right", "우측 전방")}]</td>
                  </tr>
                  <tr>
                    <td>${T("Final Position (Step 40)", "최종 도달 위치 (40 스텝)")}</td>
                    <td class="mono" style="color:var(--danger);"><strong>(1.80, +4.03) [${T("Wrong Left!", "좌측으로 이탈!")}]</strong></td>
                    <td class="mono" style="color:var(--success);"><strong>(4.60, -3.36) [${T("On Target!", "목표 지점 도달!")}]</strong></td>
                  </tr>
                  <tr>
                    <td>${T("Final Euclidean Error (d_final)", "목표와의 최종 거리 오차")}</td>
                    <td class="mono" style="color:var(--danger);"><strong>8.18 a.u. (${T("Diverges", "발산")})</strong></td>
                    <td class="mono" style="color:var(--success);"><strong>0.43 a.u. (${T("94.7% closer!", "오차 94.7% 감소!")})</strong></td>
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
      `<button class="tab-btn ${i === state.presetIdx ? 'active' : ''}" data-idx="${i}">${T(p.nameEn, p.nameKo)} (${p.frac})</button>`
    ).join("");

    Array.from(tabsEl.children).forEach((btn, i) => {
      btn.addEventListener("click", () => {
        state.presetIdx = i;
        renderPresets();
      });
    });

    const p = PRESETS[state.presetIdx];
    const displayName = T(p.nameEn, p.nameKo);
    contentEl.innerHTML = `
      <div class="grid-2">
        <div>
          <div class="badges" style="margin-bottom:10px;">
            <span class="badge green">${T("Edited Edges", "편집 간선 수")}: ${p.edges.toLocaleString()} (${p.frac})</span>
            <span class="badge">${T("Potentiated", "이득 강화")}: ${p.potentiated.toLocaleString()}</span>
            <span class="badge purple">${T("Suppressed", "가중치 감쇠")}: ${p.suppressed.toLocaleString()}</span>
            <span class="badge" style="color:var(--danger);border-color:#e2c4c4;">${T("Ablated (W←0)", "절제 (W←0)")}: ${p.ablated.toLocaleString()}</span>
          </div>
          <h3 style="margin-top:4px;">${displayName} — <span style="color:var(--accent);font-family:var(--font-mono);font-size:0.95em;">${T(`${p.frac} of Connectome`, `전체 시냅스의 ${p.frac}`)}</span></h3>
          <p style="font-size:14px;font-weight:600;color:var(--text-muted);margin-bottom:10px;">
            ${T("Primary Circuit Mechanism:", "핵심 회로 편집 메커니즘:")} <code>${T(p.circuitEn, p.circuitKo)}</code>
          </p>
          <p style="font-size:14.5px;">${T(p.storyEn, p.storyKo)}</p>
          <div style="margin-top:16px;">
            <a class="btn" href="lab.html" style="font-size:13px;padding:7px 14px;">
              ${T(`Test ${p.nameEn} Live in 3D MuJoCo Simulator →`, `3D MuJoCo 시뮬레이터에서 ${p.nameEn} 직접 실험하기 →`)}
            </a>
          </div>
        </div>
        <div>
          <h4>${T("Quantitative Sensorimotor Readout Profile", "감각 자극 조건별 하행 운동 뉴런 발화율 및 제어 출력")}</h4>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${T("Sensory Assay (55 Hz Hunger)", "감각 자극 조건 (기본 섭식 동기 55 Hz)")}</th>
                  <th>${T(`${p.nameEn} Readout`, `편집 모델 출력`)}</th>
                  <th>${T("Wild-Type Baseline", "Wild-Type 원본 기준")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${T("Left Odor (130L / 20R Hz) Turn", "좌측 냄새 자극 (좌 130 / 우 20 Hz) 조향")}</td>
                  <td class="mono"><strong>${T(p.metrics.leftOdorTurn.en, p.metrics.leftOdorTurn.ko)}</strong></td>
                  <td class="mono">${T("-0.77 (L)", "-0.77 (좌회전)")}</td>
                </tr>
                <tr>
                  <td>${T("Right Odor (20L / 130R Hz) Turn", "우측 냄새 자극 (좌 20 / 우 130 Hz) 조향")}</td>
                  <td class="mono"><strong>${T(p.metrics.rightOdorTurn.en, p.metrics.rightOdorTurn.ko)}</strong></td>
                  <td class="mono">${T("-0.71 (Wrong L)", "-0.71 (좌회전 오류)")}</td>
                </tr>
                <tr>
                  <td>${T("Center Plume (100L / 100R Hz) Turn", "중앙 대칭 냄새 (좌 100 / 우 100 Hz) 조향")}</td>
                  <td class="mono"><strong>${T(p.metrics.centerTurn.en, p.metrics.centerTurn.ko)}</strong></td>
                  <td class="mono">${T("-0.47 (L drift)", "-0.47 (좌측 쏠림)")}</td>
                </tr>
                <tr>
                  <td>${T("Forward Sprint", "전진 보행")} <code>DNg97</code> ${T("Rate", "발화율")}</td>
                  <td class="mono"><strong>${T(p.metrics.fwdSprint.en, p.metrics.fwdSprint.ko)}</strong></td>
                  <td class="mono">${T("1.3 Hz (cmd 0.61)", "1.3 Hz (명령 0.61)")}</td>
                </tr>
                <tr>
                  <td>${T("Strong Looming Escape (220 Hz)", "강한 포식자 접근 (220 Hz)")} <code>DNp01</code></td>
                  <td class="mono"><strong>${T(p.metrics.escapeStrong.en, p.metrics.escapeStrong.ko)}</strong></td>
                  <td class="mono">${T("202.4 Hz (cmd 1.00)", "202.4 Hz (명령 1.00)")}</td>
                </tr>
                <tr>
                  <td>${T("Weak Looming Escape (35 Hz)", "약한 포식자 접근 (35 Hz)")} <code>DNp01</code></td>
                  <td class="mono"><strong>${T(p.metrics.escapeWeak.en, p.metrics.escapeWeak.ko)}</strong></td>
                  <td class="mono">${T("116.2 Hz (cmd 1.00)", "116.2 Hz (명령 1.00)")}</td>
                </tr>
                <tr>
                  <td>${T("Weak Antennal Touch (18 Hz)", "미세 더듬이 접촉 (18 Hz)")} <code>DNg62</code></td>
                  <td class="mono"><strong>${T(p.metrics.groomWeak.en, p.metrics.groomWeak.ko)}</strong></td>
                  <td class="mono">${T("0.0 Hz (cmd 0.00)", "0.0 Hz (명령 0.00)")}</td>
                </tr>
                <tr>
                  <td>${T("Weak Gustatory Sugar (40 Hz)", "저농도 당분 접촉 (40 Hz)")} <code>MN9</code></td>
                  <td class="mono"><strong>${T(p.metrics.feedWeak.en, p.metrics.feedWeak.ko)}</strong></td>
                  <td class="mono">${T("19.0 Hz (cmd 0.54)", "19.0 Hz (명령 0.54)")}</td>
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
      <h4>${T("Cross-Task Behavioral Orthogonality Matrix (Δ Readout Relative to Wild-Type Baseline)", "과제 간 행동 직교성 행렬 (Wild-Type 원본 대비 출력 변화량 Δ — 비표적 과제 간섭 0.00)")}</h4>
      <div class="table-wrap" style="margin-bottom:26px;">
        <table>
          <thead>
            <tr>
              <th>${T("Surgical Connectome Phenotype", "커넥톰 회로 편집 표현형")}</th>
              <th>${T("Edited Edges (Brain %)", "편집 간선 수 (전체 비율)")}</th>
              <th>${T("Right Odor Steering (Δcmd)", "우측 냄새 조향 변화 (Δcmd)")}</th>
              <th>${T("Forward Sprint DNg97 (Δcmd)", "전진 보행 DNg97 변화 (Δcmd)")}</th>
              <th>${T("Looming Escape DNp01 (Δ)", "포식자 도피 DNp01 변화 (Δ)")}</th>
              <th>${T("Antennal Grooming DNg62 (Δcmd)", "더듬이 세정 DNg62 변화 (Δcmd)")}</th>
              <th>${T("Proboscis Feeding MN9 (Δcmd)", "구기 신전 섭식 MN9 변화 (Δcmd)")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono"><strong>Super-Forager</strong></td>
              <td class="mono">70,530 (0.4673%)</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+1.51 (-0.71 &rarr; +0.80)</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+0.39 (+48.4 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">${T("0.00 (0.0 Hz drift)", "0.00 (간섭 없음)")}</td>
              <td class="mono" style="color:var(--text-muted);">${T("0.00 (0.0 Hz drift)", "0.00 (간섭 없음)")}</td>
              <td class="mono" style="color:var(--text-muted);">${T("0.00 (0.0 Hz drift)", "0.00 (간섭 없음)")}</td>
            </tr>
            <tr>
              <td class="mono"><strong>Fearless Fly</strong></td>
              <td class="mono">1,692 (0.0112%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(122,40,40,0.16);color:var(--danger);font-weight:700;">-1.00 (202.4 &rarr; 0.0 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Hyper-Escape</strong></td>
              <td class="mono">63,867 (0.4232%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+127.2 Hz (116.2 &rarr; 243.4 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Obsessive Groomer</strong></td>
              <td class="mono">21,820 (0.1446%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+1.00 (0.0 &rarr; 219.9 Hz)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
            </tr>
            <tr>
              <td class="mono"><strong>Voracious Feeder</strong></td>
              <td class="mono">6,954 (0.0461%)</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="color:var(--text-muted);">0.00</td>
              <td class="mono" style="background:rgba(31,78,61,0.16);color:var(--success);font-weight:700;">+0.46 (19.0 &rarr; 44.2 Hz)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4>${T("Complete Quantitative Sensorimotor Benchmark Table (Paper Tables 1 & 2)", "전체 6가지 커넥톰 모델의 정량 벤치마크 요약표 (논문 Table 1 & Table 2)")}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>${T("Preset Variant", "커넥톰 모델")}</th>
              <th>${T("Potentiated / Suppressed / Ablated", "강화 / 감쇠 / 절제 간선 수 (비율)")}</th>
              <th>${T("Left Odor Turn", "좌측 냄새 조향")}</th>
              <th>${T("Right Odor Turn", "우측 냄새 조향")}</th>
              <th>${T("Center Turn", "중앙 대칭 조향")}</th>
              <th>${T("Fwd Sprint DNg97", "전진 보행 DNg97")}</th>
              <th>${T("Looming 220 / 35 Hz", "포식자 도피 220/35 Hz")}</th>
              <th>${T("Grooming (18 Hz)", "세정 반사 (18 Hz)")}</th>
              <th>${T("Feeding (40 Hz)", "섭식 반사 (40 Hz)")}</th>
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
