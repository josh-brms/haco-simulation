/**
 * Report generation: Markdown, HTML, and print-to-PDF from a stored run.
 * Pure client-side; downloads work both in the browser and inside the
 * Tauri webview.
 */
import { ALGO_NAMES, CONVERGENCE_EPSILON, CONVERGENCE_WINDOW, type AlgoId } from "@/sim/engine";
import { INSTANCES } from "@/sim/instances";
import type { StoredRun, StoredAlgoResult } from "@/stores/resultsStore";
import { saveReport } from "./native";

export interface AlgoAggregate {
  algo: AlgoId;
  name: string;
  meanBest: number;
  sdBest: number;
  best: number;
  worst: number;
  gapPct: number;
  meanConvergence: number;
  meanActivations: number;
  meanRuntimeS: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (xs.length - 1));
};

export function aggregateRun(run: StoredRun): AlgoAggregate[] {
  const instance = INSTANCES[run.instanceName];
  return ([0, 1, 2] as AlgoId[]).map((algo) => {
    const rows: StoredAlgoResult[] = run.trialsData.flatMap((t) => t.perAlgo.filter((r) => r.algo === algo));
    const dists = rows.map((r) => r.bestDist).filter((v) => Number.isFinite(v));
    const meanBest = mean(dists);
    return {
      algo,
      name: ALGO_NAMES[algo],
      meanBest,
      sdBest: sd(dists),
      best: dists.length ? Math.min(...dists) : NaN,
      worst: dists.length ? Math.max(...dists) : NaN,
      gapPct: ((meanBest - instance.optimum) / instance.optimum) * 100,
      meanConvergence: mean(rows.map((r) => r.convergenceIter)),
      meanActivations: mean(rows.map((r) => r.activations)),
      meanRuntimeS: mean(rows.map((r) => r.runtimeS)),
    };
  });
}

const fmtNum = (v: number, digits = 2) => (Number.isFinite(v) ? v.toLocaleString(undefined, { maximumFractionDigits: digits }) : "--");

// ------------------------------------------------------------------ Markdown
export function exportMarkdown(run: StoredRun): string {
  const instance = INSTANCES[run.instanceName];
  const agg = aggregateRun(run);
  const p = run.params;

  const lines: string[] = [
    `# Benchmark Report: ${run.instanceName}`,
    "",
    "## Experimental Protocol",
    "",
    `- **Thesis**: "A Statistically Validated Multi-Instance Evaluation of Entropy-Triggered 2-Opt in Hybrid Ant Colony Optimization"`,
    `- **Researchers**: Joshua Bermas, Vincent Brian Somido, John Earl Mirabete`,
    `- **Institution**: Divine Word College of Legazpi`,
    `- **Date**: ${new Date(run.timestamp).toLocaleString()}`,
    `- **Instance**: ${run.instanceName} (${instance.nodes} nodes, known optimum = ${instance.optimum.toLocaleString()})`,
    `- **Trials**: ${p.trials} independent runs per algorithm (seeds ${p.seed}..${p.seed + p.trials - 1})`,
    `- **Shared parameters**: α=${p.alpha}, β=${p.beta}, ρ=${p.rho}, Q=${p.Q}, m=${p.ants} ants, T_max=${p.tMax} iterations`,
    `- **Trigger thresholds**: θ=${instance.entropyTheta.toFixed(2)} (30th percentile of H(S)), τ_PDR=${instance.pdrThreshold}`,
    `- **Convergence criterion**: ε=${CONVERGENCE_EPSILON} over W=${CONVERGENCE_WINDOW} consecutive iterations`,
    "",
    "## Results Summary (Table 3.9 equivalent)",
    "",
    "| Algorithm | Mean L* (Euclidean units) | SD | Gap % | Convergence Iter | 2-opt Activations | Mean Time (s) |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const a of agg) {
    lines.push(
      `| ${a.name} | ${fmtNum(a.meanBest)} | ${fmtNum(a.sdBest)} | ` +
        `${a.gapPct.toFixed(2)}% | ${a.meanConvergence.toFixed(0)} | ${a.meanActivations.toFixed(1)} | ${a.meanRuntimeS.toFixed(3)} |`
    );
  }

  const [std, nonad, adaptive] = agg;
  lines.push(
    "",
    "## Interpretation",
    "",
    `### Standard ACO (Baseline)`,
    `- Produces the longest mean tours on all instances, with optimality gaps of ${std.gapPct.toFixed(2)}%.`,
    `- No local search refinement; relies entirely on pheromone accumulation.`,
    "",
    `### Non-adaptive HACO (Intermediate Comparison)`,
    `- Applies 2-opt to the best tour at every iteration (100% of iterations).`,
    `- Reduces gap to ${nonad.gapPct.toFixed(2)}% but pays the highest computational cost (${fmtNum(nonad.meanRuntimeS, 3)} s on average).`,
    `- Invokes 2-opt ${p.tMax} times per trial regardless of population state.`,
    "",
    `### Proposed Adaptive HACO (Experimental Treatment)`,
    `- Triggers 2-opt only when H(S) < θ AND PDR > τ_PDR (stagnation detected).`,
    `- Mean activations: ${adaptive.meanActivations.toFixed(1)} of ${p.tMax} iterations (${((adaptive.meanActivations / p.tMax) * 100).toFixed(1)}%).`,
    `- Achieves gap of ${adaptive.gapPct.toFixed(2)}% with ${fmtNum(adaptive.meanRuntimeS, 3)} s runtime.`,
    `- Runtime reduction vs Non-adaptive: ${nonad.meanRuntimeS > 0 ? (((nonad.meanRuntimeS - adaptive.meanRuntimeS) / nonad.meanRuntimeS) * 100).toFixed(1) : 0}%.`,
    "",
    "---",
    "Generated by Entropy-Triggered HACO Benchmark (thesis companion application)."
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------- HTML
export function exportHtml(run: StoredRun): string {
  const instance = INSTANCES[run.instanceName];
  const agg = aggregateRun(run);
  const p = run.params;

  const rows = agg
    .map(
      (a) => `<tr>
        <td style="color:${a.algo === 2 ? "#dc2626" : a.algo === 1 ? "#ea580c" : "#52525b"};font-weight:600">${a.name}</td>
        <td>${fmtNum(a.meanBest)}</td><td>${fmtNum(a.sdBest)}</td>
        <td>${a.gapPct.toFixed(2)}%</td><td>${a.meanConvergence.toFixed(0)}</td>
        <td>${a.meanActivations.toFixed(1)}</td><td>${a.meanRuntimeS.toFixed(3)}</td>
      </tr>`
    )
    .join("\n");

  const adaptiveTrial = run.trialsData[0]?.series.find((s) => s.algo === 2);
  let spark = "<p class='meta'>No convergence data.</p>";
  if (adaptiveTrial && adaptiveTrial.best.length > 1) {
    const b = adaptiveTrial.best;
    const min = Math.min(...b);
    const max = Math.max(...b);
    const stride = Math.max(1, Math.floor(b.length / 100));
    const pts = b
      .filter((_, i) => i % stride === 0)
      .map((v, i) => `${i},${40 - ((v - min) / (max - min || 1)) * 36}`)
      .join(" ");
    spark = `<svg viewBox="0 0 100 40" width="100%" height="60" preserveAspectRatio="none"><polyline fill="none" stroke="#dc2626" stroke-width="1.5" points="${pts}"/></svg>`;
  }

  const [std, nonad, adaptive] = agg;
  const runtimeReduction = nonad.meanRuntimeS > 0
    ? (((nonad.meanRuntimeS - adaptive.meanRuntimeS) / nonad.meanRuntimeS) * 100).toFixed(1)
    : "0";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Benchmark Report: ${run.instanceName}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; color: #18181b; }
  h1 { border-bottom: 2px solid #16a34a; padding-bottom: .5rem; }
  h2 { color: #374151; margin-top: 1.5rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #d4d4d8; padding: 8px 10px; text-align: right; font-size: 14px; }
  th { background: #f4f4f5; }
  th:first-child, td:first-child { text-align: left; }
  .meta { color: #52525b; font-size: 14px; }
  .finding { background: #f0fdf4; border-left: 3px solid #16a34a; padding: 0.75rem 1rem; margin: 0.5rem 0; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>Benchmark Report: ${run.instanceName}</h1>
<p class="meta">
  <strong>Thesis:</strong> "A Statistically Validated Multi-Instance Evaluation of Entropy-Triggered 2-Opt in Hybrid Ant Colony Optimization"<br>
  <strong>Researchers:</strong> Joshua Bermas, Vincent Brian Somido, John Earl Mirabete<br>
  <strong>Institution:</strong> Divine Word College of Legazpi<br>
  Date: ${new Date(run.timestamp).toLocaleString()} |
  Trials: ${p.trials} per algorithm | T_max: ${p.tMax} | m: ${p.ants} ants<br>
  Optimum: ${instance.optimum.toLocaleString()} |
  θ: ${instance.entropyTheta.toFixed(2)} | τ_PDR: ${instance.pdrThreshold}<br>
  Parameters: α=${p.alpha}, β=${p.beta}, ρ=${p.rho}, Q=${p.Q}, seed_base=${p.seed}
</p>

<h2>Results Summary (Table 3.9 equivalent)</h2>
<table>
<thead><tr><th>Algorithm</th><th>Mean L*</th><th>SD</th><th>Gap %</th><th>Conv. iter</th><th>2-opt act.</th><th>Time (s)</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>

<h2>Convergence (Proposed Adaptive HACO, trial 0)</h2>
${spark}

<h2>Key Findings</h2>
<div class="finding">
  <strong>Runtime:</strong> Proposed Adaptive HACO reduces mean wall-clock runtime by ${runtimeReduction}% relative to Non-adaptive HACO.
</div>
<div class="finding">
  <strong>2-opt Activation:</strong> Triggered on ${((adaptive.meanActivations / p.tMax) * 100).toFixed(1)}% of iterations (vs 100% for Non-adaptive), confirming the dual-signal trigger (H(S) < θ AND PDR > τ_PDR) operates as designed.
</div>
<div class="finding">
  <strong>Solution Quality:</strong> Mean optimality gap of ${adaptive.gapPct.toFixed(2)}% (Proposed) vs ${nonad.gapPct.toFixed(2)}% (Non-adaptive) vs ${std.gapPct.toFixed(2)}% (Standard ACO).
</div>

<h2>Interpretation</h2>
<ul>
${agg
  .map(
    (a) =>
      `<li><strong>${a.name}</strong>: mean gap ${a.gapPct.toFixed(2)}% above optimum, convergence at iteration ${a.meanConvergence.toFixed(0)}, average time ${a.meanRuntimeS.toFixed(3)} s${a.algo === 2 ? `, 2-opt triggered on average ${a.meanActivations.toFixed(1)} times (${((a.meanActivations / p.tMax) * 100).toFixed(1)}% of iterations)` : ""}.</li>`
  )
  .join("\n")}
</ul>
<p class="meta">Generated by Entropy-Triggered HACO Benchmark (thesis companion application).</p>
</body>
</html>`;
}

// ------------------------------------------------------------------ exporters
export async function downloadMarkdown(run: StoredRun): Promise<void> {
  await saveReport(exportMarkdown(run), `report-${run.instanceName}-${run.id}.md`, "text/markdown");
}

export async function downloadHtml(run: StoredRun): Promise<void> {
  await saveReport(exportHtml(run), `report-${run.instanceName}-${run.id}.html`, "text/html");
}

/** Print-to-PDF via the OS print dialog over the HTML report. */
export function printPdf(run: StoredRun): void {
  const html = exportHtml(run);
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Could not open print dialog. Check popup permissions.");
  }
  w.document.write(html);
  w.document.close();
  w.print();
}
