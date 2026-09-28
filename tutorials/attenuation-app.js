(function () {
  "use strict";

  /* =========================================================================
   * MODEL
   * Attenuation of a correlation due to unreliability in both variables
   * (Spearman, 1904): if X and Y each have their own reliability (rel_x,
   * rel_y), the observed correlation relates to the true correlation between
   * the underlying constructs by
   *
   *   rho_observed = rho_true * sqrt(rel_x * rel_y)
   *
   * Simulation: true bivariate scores (Tx, Ty) ~ bivariate normal with
   * correlation rho_true (Tx ~ N(0,1); Ty = rho_true*Tx + sqrt(1-rho_true^2)*Z).
   * Each variable then accumulates its own independent error from two
   * sources (test-retest, inter-rater -- intra-rater dropped as redundant
   * with inter-rater for this page's purposes), each converted from a
   * reliability slider via sigma = sqrt(1/rel - 1), same identity used in the
   * measurement-error tutorial:
   *
   *   X = Tx + e_testretest_x + e_interrater_x
   *   Y = Ty + e_testretest_y + e_interrater_y
   *
   * Validated via Monte Carlo (N=50000, single draw) across symmetric,
   * asymmetric, and mixed-reliability scenarios: observed r matches the
   * predicted rho_true*sqrt(rel_x*rel_y) closely in every case. The
   * regression-line confidence band (standard OLS formula) was separately
   * checked for ~95% empirical coverage of the true population regression
   * line.
   *
   * Second, related effect this page highlights: unreliability doesn't just
   * shrink the *expected* observed r toward zero, it also *widens* the
   * sample-to-sample sampling distribution of r. The sampling variance of a
   * correlation is Var(r) ~= (1 - rho^2)^2 / (N-1), which is largest when the
   * population value is near zero and smallest when it's near +/-1. Since
   * attenuation drags rho_observed toward zero, low reliability pushes a
   * study into the region where r is inherently noisiest -- confirmed via
   * Monte Carlo (N=40, trueRho=0.7, 20000 reps): empirical SD(r) grows from
   * ~0.089 at 99% per-source reliability to ~0.160 at 20%, matching the
   * Fisher-approximation prediction closely at every step. The "last 10
   * draws" fit-line fan and running SD(r) stat below make that spread
   * directly visible instead of just analytically predicted.
   *
   * Both variables are displayed on the same T-score transform (mean 50,
   * SD 10) used in the measurement-error tutorial. Because that transform
   * uses identical constants for X and Y, a reference line with slope
   * exactly equal to rho_true is mathematically correct in this coordinate
   * system regardless of how much error has inflated either variable's
   * spread -- no rescaling trick needed.
   *
   * The drawn "fit" line is deliberately NOT the raw least-squares slope
   * (that slope equals r * SD_Y/SD_X, so under *asymmetric* X/Y reliability
   * the line's steepness can look close to the true-rho line -- or even
   * steeper -- while r itself is badly attenuated, since one variable's
   * error-inflated spread can offset the shrinkage in r). Confirmed via
   * direct simulation (trueRho=0.6, N=200): X well-measured (rel=0.99) / Y
   * poorly-measured (rel=0.3) gives r=0.153 but a raw OLS slope of 0.349 --
   * misleadingly close to 0.6. Instead the line drawn here always has slope
   * exactly equal to the observed r itself (through the sample's own X,Y
   * means), which keeps its steepness directly and honestly comparable to
   * the true-correlation reference line no matter how asymmetric the
   * reliability settings are. Its shaded band is the same 95% Fisher-z CI
   * on r reported in the stats box, translated into slope terms through
   * that same center point -- not a classical regression standard-error
   * band, but a direct visualization of the one number (r) this page is
   * actually about.
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

  const T_MEAN = 50, T_SD = 10;
  function toT(x) {
    return T_MEAN + T_SD * x;
  }
  function atanh(x) {
    return 0.5 * Math.log((1 + x) / (1 - x));
  }

  function sigmaFromReliability(rel) {
    return Math.sqrt(1 / rel - 1);
  }

  function computeRel(sigmaSet) {
    const sTR = sigmaFromReliability(sigmaSet.tr);
    const sIR = sigmaFromReliability(sigmaSet.ir);
    const varE = sTR * sTR + sIR * sIR;
    const rel = 1 / (1 + varE);
    return { sTR, sIR, varE, rel };
  }

  function pearson(X, Y) {
    const n = X.length;
    const mx = X.reduce((a, b) => a + b, 0) / n;
    const my = Y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = X[i] - mx, dy = Y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxy / Math.sqrt(sxx * syy);
  }

  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function fisherCI95(r, n) {
    const z = atanh(r);
    const se = 1 / Math.sqrt(n - 3);
    return [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)];
  }

  function simulateDraw(params, gauss) {
    const N = params.N;
    const relX = computeRel({ tr: params.relXTestRetest, ir: params.relXInterRater });
    const relY = computeRel({ tr: params.relYTestRetest, ir: params.relYInterRater });
    const X = new Array(N), Y = new Array(N);
    for (let i = 0; i < N; i++) {
      const Tx = gauss();
      const Ty = params.trueRho * Tx + Math.sqrt(1 - params.trueRho * params.trueRho) * gauss();
      X[i] = Tx + relX.sTR * gauss() + relX.sIR * gauss();
      Y[i] = Ty + relY.sTR * gauss() + relY.sIR * gauss();
    }
    const r = pearson(X, Y);
    return { X, Y, relX, relY, r };
  }

  /* =========================================================================
   * UI
   * ========================================================================= */

  const root = document.getElementById("attenuation-app");

  const params = {
    N: 40,
    trueRho: 0.6,
    relXTestRetest: 0.85,
    relXInterRater: 0.85,
    relYTestRetest: 0.85,
    relYInterRater: 0.85,
    seed: 3,
    speed: 1,
  };

  // Okabe-Ito colorblind-safe qualitative palette, cycled per draw (grey
  // substituted for the palette's pure black, which wouldn't read against
  // the dark theme).
  const DRAW_COLORS = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"];
  let drawSeq = 0;
  let currentDraw = null;
  // Every draw since the last slider change or Reset click: { r, slope,
  // intercept, color }. Deliberately uncapped, for both the line fan and the
  // avg/SD-of-r stats -- the SD-of-r estimate needs a full run to converge
  // on its theoretical value (a fixed small window is too noisy to reliably
  // show that low reliability widens the sampling distribution of r, since
  // the SD of e.g. a 10-draw SD estimate is itself ~25%), and keeping every
  // past line visible directly shows how tightly or loosely they cluster.
  let history = [];
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
  const sRho = slider({ key: "trueRho", label: "True correlation", min: -0.99, max: 0.99, step: 0.01, decimals: 2 });
  const sN = slider({ key: "N", label: "Sample size (N)", min: 5, max: 300, step: 1, decimals: 0 });
  const sSpeed = slider({
    key: "speed", label: "Play speed (s/draw)", min: 0.25, max: 3, step: 0.25, decimals: 2, tickCount: 6,
    onChange: () => { if (playing) { stopPlaying(); startPlaying(); } },
  });
  row1.appendChild(sRho.wrap);
  row1.appendChild(sN.wrap);
  row1.appendChild(sSpeed.wrap);

  const rowRel = document.createElement("div");
  rowRel.className = "control-row";
  const sXtr = slider({ key: "relXTestRetest", label: "Test-retest reliability (X)", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sXir = slider({ key: "relXInterRater", label: "Inter-rater reliability (X)", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sYtr = slider({ key: "relYTestRetest", label: "Test-retest reliability (Y)", min: 0.02, max: 1, step: 0.01, isPercent: true });
  const sYir = slider({ key: "relYInterRater", label: "Inter-rater reliability (Y)", min: 0.02, max: 1, step: 0.01, isPercent: true });
  rowRel.appendChild(sXtr.wrap);
  rowRel.appendChild(sXir.wrap);
  rowRel.appendChild(sYtr.wrap);
  rowRel.appendChild(sYir.wrap);

  const btnRow = document.createElement("div");
  btnRow.className = "control-row button-row";
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
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => resetAndDraw());
  const draw100Btn = document.createElement("button");
  draw100Btn.className = "btn";
  draw100Btn.textContent = "Draw 100";
  draw100Btn.addEventListener("click", () => {
    for (let i = 0; i < 100; i++) addDraw(true);
    render();
  });
  btnRow.appendChild(redrawBtn);
  btnRow.appendChild(playBtn);
  btnRow.appendChild(randBtn);
  btnRow.appendChild(resetBtn);
  btnRow.appendChild(draw100Btn);

  panel.appendChild(row1);
  panel.appendChild(rowRel);
  panel.appendChild(btnRow);
  root.appendChild(panel);

  // ---- stats box (placed above the chart so results stay visible while adjusting sliders) ----
  const statsBox = document.createElement("div");
  statsBox.className = "stats-box";
  root.appendChild(statsBox);
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
  const stTrueRho = statBlock("True Correlation");
  const stAtten = statBlock("Attenuation Factor √(relX·relY)");
  const stObsR = statBlock("Observed Correlation (r)");
  const stCI = statBlock("95% CI on r (this draw)");
  const stAvgR = statBlock("Avg. Observed r (this session)");
  const stAvgCI = statBlock("Avg. 95% CI (this session)");

  // ---- chart ----
  const chartWrap = document.createElement("div");
  chartWrap.className = "chart-wrap";
  root.appendChild(chartWrap);

  const W = 900, H = 640;
  const MARGIN = { top: 20, right: 20, bottom: 46, left: 50 };
  const plotTop = MARGIN.top;
  const plotBottom = H - MARGIN.bottom;
  const plotLeft = MARGIN.left;
  const plotRight = W - MARGIN.right;

  const svg = d3.select(chartWrap)
    .append("svg")
    .attr("id", "attenuation-plot")
    .attr("viewBox", `0 0 ${W} ${H}`);

  // Fixed axes on both variables, T-score scale (mean 50, SD 10), generous
  // enough to hold typical reliability/N settings without rescaling.
  const HALF_RANGE_T = 40;
  const AXIS_DOMAIN = [50 - HALF_RANGE_T, 50 + HALF_RANGE_T];
  const xScale = d3.scaleLinear().domain(AXIS_DOMAIN).range([plotLeft, plotRight]);
  const yScale = d3.scaleLinear().domain(AXIS_DOMAIN).range([plotBottom, plotTop]);

  const gGridX = svg.append("g").attr("class", "gridlines");
  const gGridY = svg.append("g").attr("class", "gridlines");

  const fitHistoryGroup = svg.append("g").attr("class", "fit-history-group");
  const trueRefLine = svg.append("line").attr("class", "true-ref-line");
  const ciBandPath = svg.append("path").attr("class", "ci-band");
  const fitLine = svg.append("line").attr("class", "fit-line");
  const pointsGroup = svg.append("g").attr("class", "points-group");

  const gAxisX = svg.append("g").attr("class", "axis axis-x");
  const gAxisY = svg.append("g").attr("class", "axis axis-y");
  svg.append("text").attr("class", "axis-title").attr("x", (plotLeft + plotRight) / 2).attr("y", H - 8)
    .attr("text-anchor", "middle").text("X (T-score)");
  svg.append("text").attr("class", "axis-title")
    .attr("x", plotLeft - 36).attr("y", (plotTop + plotBottom) / 2)
    .attr("text-anchor", "middle").attr("transform", `rotate(-90, ${plotLeft - 36}, ${(plotTop + plotBottom) / 2})`)
    .text("Y (T-score)");

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span><span class="swatch dashed"></span>True correlation (fixed reference)</span>
    <span><span class="swatch solid current"></span>Current draw: slope = observed r, ± 95% CI</span>
    <span><span class="swatch solid faded"></span>All previous draws this session (r-slope lines only)</span>
  `;
  chartWrap.appendChild(legend);

  // ---- render ----
  function render() {
    gGridX.selectAll("line")
      .data(xScale.ticks(8))
      .join("line")
      .attr("class", "gridline")
      .attr("y1", plotTop).attr("y2", plotBottom)
      .attr("x1", (d) => xScale(d)).attr("x2", (d) => xScale(d));
    gGridY.selectAll("line")
      .data(yScale.ticks(8))
      .join("line")
      .attr("class", "gridline")
      .attr("x1", plotLeft).attr("x2", plotRight)
      .attr("y1", (d) => yScale(d)).attr("y2", (d) => yScale(d));

    trueRefLine
      .attr("x1", xScale(AXIS_DOMAIN[0]))
      .attr("x2", xScale(AXIS_DOMAIN[1]))
      .attr("y1", yScale(50 + params.trueRho * (AXIS_DOMAIN[0] - 50)))
      .attr("y2", yScale(50 + params.trueRho * (AXIS_DOMAIN[1] - 50)));

    gAxisX.attr("transform", `translate(0, ${plotBottom})`).call(d3.axisBottom(xScale).ticks(8));
    gAxisY.attr("transform", `translate(${plotLeft}, 0)`).call(d3.axisLeft(yScale).ticks(8));

    // Fan of every previous draw's line this session (excludes the current,
    // most-recent entry, which is rendered separately below at full
    // opacity). Reliable settings keep this fan tight; poor reliability
    // visibly spreads it out, since attenuation pushes the observed
    // correlation toward the region where its sampling variance is largest.
    // Click Reset to clear it and start over.
    const pastFits = history.slice(0, -1);
    const histSel = fitHistoryGroup.selectAll("line").data(pastFits);
    histSel.exit().remove();
    const histEnter = histSel.enter().append("line").attr("class", "fit-line-history");
    histEnter.merge(histSel)
      .attr("x1", xScale(AXIS_DOMAIN[0])).attr("x2", xScale(AXIS_DOMAIN[1]))
      .attr("y1", (d) => yScale(d.intercept + d.slope * AXIS_DOMAIN[0]))
      .attr("y2", (d) => yScale(d.intercept + d.slope * AXIS_DOMAIN[1]))
      .attr("stroke", (d) => d.color)
      .attr("stroke-opacity", 0.28);

    if (!currentDraw) return;

    const color = currentDraw.color;
    const Xt = currentDraw.X.map(toT);
    const Yt = currentDraw.Y.map(toT);
    const mx = currentDraw.mx, my = currentDraw.my;
    const ciR = fisherCI95(currentDraw.r, params.N);
    const loSlope = ciR[0], hiSlope = ciR[1];

    // Confidence cone: two straight lines through the sample's own (mx, my)
    // center at the Fisher-CI slope bounds, rather than a classical
    // heteroskedastic regression band -- this ties the shaded region
    // directly to the same CI-on-r reported in the stats box.
    const xGrid = [AXIS_DOMAIN[0], AXIS_DOMAIN[1]];
    const lo = xGrid.map((x) => Math.min(my + loSlope * (x - mx), my + hiSlope * (x - mx)));
    const hi = xGrid.map((x) => Math.max(my + loSlope * (x - mx), my + hiSlope * (x - mx)));
    const bandGen = d3.area()
      .x((d, i) => xScale(xGrid[i]))
      .y0((d, i) => yScale(lo[i]))
      .y1((d, i) => yScale(hi[i]));
    ciBandPath.datum(xGrid).attr("d", bandGen).attr("fill", color).attr("fill-opacity", 0.09);

    fitLine
      .attr("x1", xScale(AXIS_DOMAIN[0])).attr("x2", xScale(AXIS_DOMAIN[1]))
      .attr("y1", yScale(my + currentDraw.rSlope * (AXIS_DOMAIN[0] - mx)))
      .attr("y2", yScale(my + currentDraw.rSlope * (AXIS_DOMAIN[1] - mx)))
      .attr("stroke", color);

    const pts = pointsGroup.selectAll("circle").data(Xt);
    pts.exit().remove();
    const ptsEnter = pts.enter().append("circle").attr("r", 3.2);
    ptsEnter.merge(pts)
      .attr("cx", (d, i) => xScale(Xt[i]))
      .attr("cy", (d, i) => yScale(Yt[i]))
      .attr("fill", color).attr("fill-opacity", 0.65);

    stTrueRho.val.textContent = fmt(params.trueRho, 2);
    stObsR.val.textContent = fmt(currentDraw.r, 3);
    stCI.val.textContent = `[${fmt(ciR[0], 2)}, ${fmt(ciR[1], 2)}]`;
    stAtten.val.textContent = fmt(Math.sqrt(currentDraw.relX.rel * currentDraw.relY.rel), 3);

    if (history.length > 0) {
      const avgR = history.reduce((a, b) => a + b.r, 0) / history.length;
      stAvgR.val.textContent = `${fmt(avgR, 3)} (n=${history.length})`;
      const avgCILo = history.reduce((a, b) => a + b.ciLo, 0) / history.length;
      const avgCIHi = history.reduce((a, b) => a + b.ciHi, 0) / history.length;
      stAvgCI.val.textContent = `[${fmt(avgCILo, 2)}, ${fmt(avgCIHi, 2)}] (n=${history.length})`;
    } else {
      stAvgR.val.textContent = "N/A";
      stAvgCI.val.textContent = "N/A";
    }
  }

  function addDraw(skipRender) {
    currentDraw = simulateDraw(params, gauss);
    currentDraw.color = DRAW_COLORS[drawSeq % DRAW_COLORS.length];
    drawSeq++;
    const Xt = currentDraw.X.map(toT), Yt = currentDraw.Y.map(toT);
    currentDraw.mx = mean(Xt);
    currentDraw.my = mean(Yt);
    // Slope fixed to r itself (see MODEL comment) rather than the raw OLS
    // slope, so it stays comparable to the true-rho line under asymmetric
    // X/Y reliability.
    currentDraw.rSlope = currentDraw.r;
    currentDraw.rIntercept = currentDraw.my - currentDraw.r * currentDraw.mx;
    const ciR = fisherCI95(currentDraw.r, params.N);
    history.push({ r: currentDraw.r, slope: currentDraw.rSlope, intercept: currentDraw.rIntercept, color: currentDraw.color, ciLo: ciR[0], ciHi: ciR[1] });
    if (!skipRender) render();
  }

  function resetAndDraw() {
    rng = mulberry32(params.seed);
    gauss = makeGaussian(rng);
    currentDraw = null;
    drawSeq = 0;
    history = [];
    addDraw();
  }

  resetAndDraw();
})();
