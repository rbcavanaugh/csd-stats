(function () {
  "use strict";

  /* =========================================================================
   * MODEL
   * Classical Test Theory / Generalizability-theory style decomposition.
   *
   * Population: true scores T_i ~ N(0, 1) for a simulated sample of N
   * respondents (standardized construct; displayed to the user on a
   * T-score-like scale, mean 50 / SD 10 -- see toT() below). Observed score
   * per respondent:
   *
   *   X_i = T_i + e_rater + e_intra + e_occasion + e_forms
   *
   * Each e_* ~ N(0, sigma_*^2). Sliders are framed as *reliability*
   * coefficients (0-100%), which is the familiar unit ("inter-rater
   * reliability was 85%"); each is converted to its implied error SD via
   * the single-source-reliability identity rho_x = 1/(1+sigma_x^2), i.e.
   * sigma_x = sqrt(1/rho_x - 1).
   *
   * Composite reliability: rho = Var(T) / (Var(T) + Var(E_total))
   *   Var(E_total) = sigma_rater^2 + sigma_intra^2 + sigma_occasion^2
   *                  + sigma_forms^2
   *
   * Rather than summarizing each draw down to a mean +/- CI, we show the
   * actual empirical distribution of that draw's N observed scores (a
   * Gaussian KDE), overlaid against the fixed true-score distribution --
   * directly illustrating how well (or badly) a sample of this size, under
   * this much error, recovers the shape of the true population, not just
   * its center. The mean is one marker on that curve, not the whole story.
   * ========================================================================= */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeGaussian(rng) {
    let spare = null;
    return function () {
      if (spare !== null) {
        const v = spare;
        spare = null;
        return v;
      }
      let u, v, s;
      do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const mul = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * mul;
      return u * mul;
    };
  }

  function normalPdf(x, sd) {
    return Math.exp(-0.5 * (x / sd) * (x / sd)) / (sd * Math.sqrt(2 * Math.PI));
  }

  // T-score display scale: standardized units (mean 0, SD 1) -> T (mean 50, SD 10)
  const T_MEAN = 50, T_SD = 10;
  function toT(x) {
    return T_MEAN + T_SD * x;
  }

  function sigmaFromReliability(rel) {
    return Math.sqrt(1 / rel - 1);
  }

  function computeReliability(params) {
    const sigmaRater = sigmaFromReliability(params.relRater);
    const sigmaIntra = sigmaFromReliability(params.relIntra);
    const sigmaOccasion = sigmaFromReliability(params.relOccasion);
    const sigmaForms = sigmaFromReliability(params.relForms);
    const varE =
      sigmaRater * sigmaRater +
      sigmaIntra * sigmaIntra +
      sigmaOccasion * sigmaOccasion +
      sigmaForms * sigmaForms;
    const rho = 1 / (1 + varE);
    const sem = Math.sqrt(varE); // standardized units
    const popSD = Math.sqrt(1 + varE); // population SD of individual scores; independent of N
    return { sigmaRater, sigmaIntra, sigmaOccasion, sigmaForms, varE, rho, sem, popSD };
  }

  function simulateDraw(params, rel, gauss) {
    const N = params.N;
    const X = new Array(N);
    for (let i = 0; i < N; i++) {
      const T = gauss();
      const eR = rel.sigmaRater * gauss();
      const eI = rel.sigmaIntra * gauss();
      const eO = rel.sigmaOccasion * gauss();
      const eF = rel.sigmaForms * gauss();
      X[i] = T + eR + eI + eO + eF;
    }
    const mean = X.reduce((a, b) => a + b, 0) / N;
    const variance = N > 1 ? X.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (N - 1) : rel.popSD * rel.popSD;
    const sd = Math.sqrt(variance);
    return { X, mean, sd };
  }

  // Gaussian KDE (Silverman's rule of thumb bandwidth) evaluated over a grid
  // of standardized scores; returns density values aligned to that grid.
  function kde(X, grid) {
    const n = X.length;
    const mean = X.reduce((a, b) => a + b, 0) / n;
    const variance = n > 1 ? X.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1) : 1;
    const sd = Math.max(Math.sqrt(variance), 1e-6);
    const h = Math.max(1.06 * sd * Math.pow(n, -0.2), 0.05);
    return grid.map((x) => {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const u = (x - X[i]) / h;
        sum += Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
      }
      return sum / (n * h);
    });
  }

  /* =========================================================================
   * UI
   * ========================================================================= */

  const root = document.getElementById("reliability-app");

  const params = {
    N: 30,
    relRater: 0.85,
    relIntra: 0.85,
    relOccasion: 0.85,
    relForms: 0.85,
    seed: 3,
    speed: 1,
  };

  // Categorical palette cycled through per draw, recycling once exhausted.
  const DRAW_COLORS = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"];
  let drawSeq = 0;

  const RECENT_MAX = 10;
  let recentStats = [];

  let currentDraw = null;
  let previousDraw = null;
  let rng = mulberry32(params.seed);
  let gauss = makeGaussian(rng);
  let playing = false;
  let playTimer = null;

  function fmt(v, d) {
    return Number(v).toFixed(d);
  }
  function fmtPct(v) {
    return Math.round(v * 100) + "%";
  }

  function tickLabels(min, max, step, count) {
    const labels = [];
    for (let i = 0; i < count; i++) {
      let v = min + ((max - min) * i) / (count - 1);
      v = Math.round(v / step) * step;
      labels.push(v);
    }
    return labels;
  }

  function slider({ key, label, min, max, step, decimals, tickCount = 7, isPercent = false, onChange }) {
    const format = isPercent ? fmtPct : (v) => fmt(v, decimals);
    const wrap = document.createElement("div");
    wrap.className = "control";
    const lab = document.createElement("label");
    lab.textContent = label;
    const valueRow = document.createElement("div");
    valueRow.className = "value-row";
    const input = document.createElement("input");
    input.type = "range";
    input.min = min; input.max = max; input.step = step; input.value = params[key];
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.textContent = format(params[key]);
    valueRow.appendChild(input);
    valueRow.appendChild(bubble);

    const ticks = document.createElement("div");
    ticks.className = "ticks";
    tickLabels(min, max, step, tickCount).forEach((v) => {
      const s = document.createElement("span");
      s.textContent = format(v);
      ticks.appendChild(s);
    });

    input.addEventListener("input", () => {
      params[key] = +input.value;
      bubble.textContent = format(params[key]);
      if (onChange) onChange(); else resetAndDraw();
    });

    wrap.appendChild(lab);
    wrap.appendChild(valueRow);
    wrap.appendChild(ticks);
    return { wrap, input, bubble };
  }

  const panel = document.createElement("div");
  panel.className = "control-panel";

  const row1 = document.createElement("div");
  row1.className = "control-row";
  const sN = slider({ key: "N", label: "Sample size (N)", min: 5, max: 200, step: 1, decimals: 0 });
  const sRater = slider({ key: "relRater", label: "Inter-rater reliability", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sIntra = slider({ key: "relIntra", label: "Intra-rater reliability", min: 0.02, max: 1, step: 0.01, isPercent: true });
  row1.appendChild(sN.wrap);
  row1.appendChild(sRater.wrap);
  row1.appendChild(sIntra.wrap);

  const row2 = document.createElement("div");
  row2.className = "control-row";
  const sOccasion = slider({ key: "relOccasion", label: "Test-retest reliability", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sForms = slider({ key: "relForms", label: "Alternate-forms reliability", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sSpeed = slider({
    key: "speed", label: "Play speed (s/draw)", min: 0.25, max: 3, step: 0.25, decimals: 2, tickCount: 6,
    onChange: () => { if (playing) { stopPlaying(); startPlaying(); } },
  });
  row2.appendChild(sOccasion.wrap);
  row2.appendChild(sForms.wrap);
  row2.appendChild(sSpeed.wrap);

  const row3 = document.createElement("div");
  row3.className = "control-row row3";

  const btnCell = document.createElement("div");
  btnCell.className = "control button-cell";
  const redrawBtn = document.createElement("button");
  redrawBtn.className = "btn";
  redrawBtn.textContent = "Redraw";
  redrawBtn.addEventListener("click", () => addDraw());
  function startPlaying() {
    playTimer = setInterval(addDraw, params.speed * 1000);
  }
  function stopPlaying() {
    clearInterval(playTimer);
    playTimer = null;
  }
  const playBtn = document.createElement("button");
  playBtn.className = "btn primary";
  playBtn.textContent = "Play";
  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "Pause" : "Play";
    playBtn.classList.toggle("active", playing);
    if (playing) startPlaying(); else stopPlaying();
  });
  const randBtn = document.createElement("button");
  randBtn.className = "btn";
  randBtn.textContent = "Randomize Seed";
  randBtn.addEventListener("click", () => {
    params.seed = 1 + Math.floor(Math.random() * 1000);
    resetAndDraw();
  });
  btnCell.appendChild(redrawBtn);
  btnCell.appendChild(playBtn);
  btnCell.appendChild(randBtn);
  row3.appendChild(btnCell);

  panel.appendChild(row1);
  panel.appendChild(row2);
  panel.appendChild(row3);
  root.appendChild(panel);

  // ---- chart ----
  const chartWrap = document.createElement("div");
  chartWrap.className = "chart-wrap";

  const W = 1200, H = 500;
  const MARGIN = { top: 20, right: 30, bottom: 40, left: 30 };
  const plotTop = MARGIN.top;
  const plotBottom = H - MARGIN.bottom;
  const plotLeft = MARGIN.left;
  const plotRight = W - MARGIN.right;

  const svg = d3.select(chartWrap)
    .append("svg")
    .attr("id", "reliability-plot")
    .attr("viewBox", `0 0 ${W} ${H}`);

  // Fixed score axis, chosen once -- generous enough to hold the true score
  // distribution (T-score SD=10) across a wide range of reliability/N
  // settings without ever rescaling.
  const X_HALF_RANGE_T = 40;
  const X_DOMAIN = [50 - X_HALF_RANGE_T, 50 + X_HALF_RANGE_T];
  const xScale = d3.scaleLinear().domain(X_DOMAIN).range([plotLeft, plotRight]);
  let yScale = d3.scaleLinear().range([plotBottom, plotTop]);

  const gGridX = svg.append("g").attr("class", "gridlines");
  const trueMeanLine = svg.append("line").attr("class", "zero-line");

  const trueArea = svg.append("path").attr("class", "true-density-area");
  const truePath = svg.append("path").attr("class", "true-density-path").attr("fill", "none");

  const prevArea = svg.append("path").attr("class", "sample-density-area");
  const prevPath = svg.append("path").attr("class", "sample-density-path").attr("fill", "none");
  const curArea = svg.append("path").attr("class", "sample-density-area");
  const curPath = svg.append("path").attr("class", "sample-density-path").attr("fill", "none");
  const curMeanMarker = svg.append("circle").attr("class", "current-marker").attr("r", 6);

  const gAxisX = svg.append("g").attr("class", "axis axis-x");
  svg.append("text").attr("class", "axis-title").attr("x", (plotLeft + plotRight) / 2).attr("y", H - 6)
    .attr("text-anchor", "middle").text("T-score");

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span><span class="swatch dashed"></span>True score distribution (fixed)</span>
    <span><span class="swatch solid current"></span>Current draw (new color each time)</span>
    <span><span class="swatch solid faded"></span>Previous draw (fading out)</span>
  `;
  chartWrap.appendChild(legend);

  // ---- stats box (placed above the chart so results stay visible while adjusting sliders) ----
  const statsBox = document.createElement("div");
  statsBox.className = "stats-box";
  root.appendChild(statsBox);
  root.appendChild(chartWrap);
  const statsRow = document.createElement("div");
  statsRow.className = "stats-row";
  statsBox.appendChild(statsRow);

  function statBlock(labelText) {
    const block = document.createElement("div");
    block.className = "stat-block";
    const lab = document.createElement("div");
    lab.className = "stat-label";
    lab.textContent = labelText;
    const val = document.createElement("div");
    val.className = "stat-value";
    block.appendChild(lab);
    block.appendChild(val);
    statsRow.appendChild(block);
    return { block, val };
  }
  const stReliability = statBlock("Overall Reliability (ρ)");
  const stSem = statBlock("SEM (T-score points)");
  const stMean = statBlock("Current Sample Mean (true = 50)");
  const stSd = statBlock("Current Sample SD (true = 10)");
  const stAvgMean = statBlock("Avg. Sample Mean (last 10 draws)");
  const stAvgSd = statBlock("Avg. Sample SD (last 10 draws)");

  // ---- render ----
  const GRID_N = 200;
  const halfWidthStd = X_HALF_RANGE_T / T_SD;
  const scoresStd = new Array(GRID_N);
  for (let i = 0; i < GRID_N; i++) {
    scoresStd[i] = -halfWidthStd + (2 * halfWidthStd * i) / (GRID_N - 1);
  }
  const scoresT = scoresStd.map(toT);

  function render() {
    const rel = computeReliability(params);

    const trueDens = scoresStd.map((s) => normalPdf(s, 1));
    const curDens = currentDraw ? kde(currentDraw.X, scoresStd) : null;
    const prevDens = previousDraw ? kde(previousDraw.X, scoresStd) : null;

    let maxDens = Math.max(...trueDens);
    if (curDens) maxDens = Math.max(maxDens, ...curDens);
    if (prevDens) maxDens = Math.max(maxDens, ...prevDens);
    yScale = d3.scaleLinear().domain([0, maxDens * 1.1]).range([plotBottom, plotTop]);

    gGridX.selectAll("line")
      .data(xScale.ticks(8))
      .join("line")
      .attr("class", "gridline")
      .attr("y1", plotTop).attr("y2", plotBottom)
      .attr("x1", (d) => xScale(d)).attr("x2", (d) => xScale(d));

    trueMeanLine
      .attr("x1", xScale(50)).attr("x2", xScale(50))
      .attr("y1", plotTop).attr("y2", plotBottom);

    const lineGen = (dens) => d3.line().x((d, i) => xScale(scoresT[i])).y((d, i) => yScale(dens[i]));
    const areaGen = (dens) => d3.area().x((d, i) => xScale(scoresT[i])).y0(plotBottom).y1((d, i) => yScale(dens[i]));

    truePath.datum(trueDens).attr("d", lineGen(trueDens)).attr("stroke", "var(--muted)").attr("stroke-width", 1.8);
    trueArea.datum(trueDens).attr("d", areaGen(trueDens)).attr("fill", "var(--muted)").attr("fill-opacity", 0.12);

    if (prevDens) {
      prevPath.datum(prevDens).attr("d", lineGen(prevDens))
        .attr("stroke", previousDraw.color).attr("stroke-width", 1.6).attr("stroke-opacity", 0.2);
      prevArea.datum(prevDens).attr("d", areaGen(prevDens))
        .attr("fill", previousDraw.color).attr("fill-opacity", 0.2);
    } else {
      prevPath.attr("stroke-opacity", 0);
      prevArea.attr("fill-opacity", 0);
    }

    if (curDens) {
      curPath.datum(curDens).attr("d", lineGen(curDens))
        .attr("stroke", currentDraw.color).attr("stroke-width", 2).attr("stroke-opacity", 0.7);
      curArea.datum(curDens).attr("d", areaGen(curDens))
        .attr("fill", currentDraw.color).attr("fill-opacity", 0.7);
      const meanDensAtMean = kde(currentDraw.X, [currentDraw.mean])[0];
      curMeanMarker
        .attr("cx", xScale(toT(currentDraw.mean)))
        .attr("cy", yScale(meanDensAtMean))
        .attr("opacity", 1);
    } else {
      curPath.attr("stroke-opacity", 0);
      curArea.attr("fill-opacity", 0);
      curMeanMarker.attr("opacity", 0);
    }

    gAxisX.attr("transform", `translate(0, ${plotBottom})`).call(d3.axisBottom(xScale).ticks(8));

    stReliability.val.textContent = fmt(rel.rho, 3);
    stSem.val.textContent = fmt(rel.sem * T_SD, 1);
    if (currentDraw) {
      stMean.val.textContent = fmt(toT(currentDraw.mean), 1);
      stSd.val.textContent = fmt(currentDraw.sd * T_SD, 1);
    } else {
      stMean.val.textContent = "N/A";
      stSd.val.textContent = "N/A";
    }
    if (recentStats.length > 0) {
      const avgMean = recentStats.reduce((a, b) => a + b.mean, 0) / recentStats.length;
      const avgSd = recentStats.reduce((a, b) => a + b.sd, 0) / recentStats.length;
      stAvgMean.val.textContent = `${fmt(avgMean, 1)} (n=${recentStats.length})`;
      stAvgSd.val.textContent = `${fmt(avgSd, 1)} (n=${recentStats.length})`;
    } else {
      stAvgMean.val.textContent = "N/A";
      stAvgSd.val.textContent = "N/A";
    }
  }

  function addDraw() {
    const rel = computeReliability(params);
    previousDraw = currentDraw;
    currentDraw = simulateDraw(params, rel, gauss);
    currentDraw.color = DRAW_COLORS[drawSeq % DRAW_COLORS.length];
    drawSeq++;
    recentStats.push({ mean: toT(currentDraw.mean), sd: currentDraw.sd * T_SD });
    if (recentStats.length > RECENT_MAX) recentStats.shift();
    render();
  }

  function resetAndDraw() {
    rng = mulberry32(params.seed);
    gauss = makeGaussian(rng);
    currentDraw = null;
    previousDraw = null;
    drawSeq = 0;
    recentStats = [];
    addDraw();
  }

  resetAndDraw();
})();
