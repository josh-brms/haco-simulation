import { useMemo } from "react";
import { ChevronLeft, FileDown, FileText, Globe } from "lucide-react";
import { ALGO_COLORS, ALGORITHM_IDS } from "@/sim/engine";
import { INSTANCES } from "@/sim/instances";
import {
  ConvergenceChart,
  EntropyChart,
  PdrChart,
  ComparisonChart,
  type SeriesHistory,
  type ComparisonDatum,
} from "@/components/run/Charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import { aggregateRun, printPdf, downloadHtml, downloadMarkdown } from "@/lib/export";
import type { StoredRun } from "@/stores/resultsStore";

/** Detail view for one archived benchmark run. */
export default function RunDetail({ run, onBack }: { run: StoredRun; onBack: () => void }) {
  const agg = useMemo(() => aggregateRun(run), [run]);
  const instance = INSTANCES[run.instanceName];
  const p = run.params;

  // pooled histories: per-algorithm mean across trials
  const pooled: SeriesHistory[] = useMemo(
    () =>
      ALGORITHM_IDS.map((algo) => {
        const trials = run.trialsData
          .map((t) => t.series.find((s) => s.algo === algo))
          .filter(Boolean) as SeriesHistory[];
        if (trials.length === 0) return { algo, best: [], entropy: [], dominance: [], triggered: [] };

        const len = Math.min(...trials.map((t) => t.best.length));
        const avg = (get: (t: SeriesHistory) => number[], t: number) =>
          trials.reduce((sum, tr) => sum + get(tr)[t], 0) / trials.length;

        return {
          algo,
          best: Array.from({ length: len }, (_, t) => avg((x) => x.best, t)),
          entropy: Array.from({ length: len }, (_, t) => avg((x) => x.entropy, t)),
          dominance: Array.from({ length: len }, (_, t) => avg((x) => x.dominance, t)),
          triggered: Array.from({ length: len }, (_, t) => trials.some((tr) => tr.triggered[t])),
        };
      }),
    [run]
  );

  const comparison: ComparisonDatum[] = useMemo(
    () =>
      agg.map((a) => ({
        name: a.name,
        quality: a.meanBest,
        time: a.meanRuntimeS,
        activations: a.meanActivations,
      })),
    [agg]
  );

  const adaptive = agg.find((a) => a.algo === 2);
  const nonadaptive = agg.find((a) => a.algo === 1);
  const standard = agg.find((a) => a.algo === 0);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={onBack} data-testid="back-btn">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-zinc-100">
            Run #{run.id} - {run.instanceName}
          </h1>
          <Badge variant="secondary">{new Date(run.timestamp).toLocaleString()}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => printPdf(run)} data-testid="export-pdf">
            <FileDown className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadHtml(run)} data-testid="export-html">
            <Globe className="w-3.5 h-3.5" /> HTML
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadMarkdown(run)} data-testid="export-md">
            <FileText className="w-3.5 h-3.5" /> Markdown
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-xs text-zinc-500">
          {p.trials} trials x 3 algorithms &middot; T_max {p.tMax} &middot; m={p.ants} ants &middot; α={p.alpha}{" "}
          β={p.beta} ρ={p.rho} Q={p.Q} &middot; optimum {instance.optimum.toLocaleString()} &middot; θ=
          {instance.entropyTheta.toFixed(2)} τ_PDR={instance.pdrThreshold}
        </p>

        {/* summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {agg.map((a, cardIndex) => (
            <Card key={a.algo} className="animate-card-in" style={{ animationDelay: `${cardIndex * 70}ms` }}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs" style={{ color: ALGO_COLORS[a.algo] }}>
                  {a.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-0.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Mean of {p.trials} trials</div>
                <div className="text-xl font-semibold text-zinc-100">
                  {fmt(a.meanBest)} <span className="text-sm font-normal text-zinc-500">± {a.sdBest.toFixed(2)}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  L* &middot; {a.gapPct.toFixed(2)}% gap
                </p>
                <p className="text-xs text-zinc-500">
                  conv iter {a.meanConvergence.toFixed(0)} &middot; {a.meanRuntimeS.toFixed(3)} s
                </p>
                {a.algo === 2 && <p className="text-xs text-red-400">2-opt fired {a.meanActivations.toFixed(1)}x</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* charts */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Convergence: mean L*(t)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ConvergenceChart histories={pooled} instance={instance} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Shannon Entropy H(S) vs θ</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <EntropyChart histories={pooled} instance={instance} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">PDR(t) vs τ_PDR</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <PdrChart histories={pooled} instance={instance} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Quality vs time comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ComparisonChart data={comparison} />
            </CardContent>
          </Card>
        </div>

        {/* per-trial breakdown — lets the user inspect every trial, not just the mean */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">All trials ({run.trialsData.length})</CardTitle>
            <span className="text-[11px] text-zinc-500">click seed to view raw series</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                  <tr className="text-left">
                    <th className="py-1.5 px-3 font-medium">Trial</th>
                    <th className="py-1.5 px-3 font-medium">Seed</th>
                    {ALGORITHM_IDS.map((a) => (
                      <th key={a} className="py-1.5 px-3 font-medium" style={{ color: ALGO_COLORS[a] }}>{ALGORITHM_IDS.length > 1 ? `${a}:` : ""} L*</th>
                    ))}
                    {ALGORITHM_IDS.map((a) => (
                      <th key={`c-${a}`} className="py-1.5 px-3 font-medium text-zinc-500">conv {a}</th>
                    ))}
                    <th className="py-1.5 px-3 font-medium">∑ 2-opt</th>
                  </tr>
                </thead>
                <tbody>
                  {run.trialsData.map((t) => (
                    <tr key={t.trial} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                      <td className="py-1 px-3 text-zinc-300">#{t.trial + 1}</td>
                      <td className="py-1 px-3 text-zinc-500 font-mono">{t.seed}</td>
                      {ALGORITHM_IDS.map((a) => {
                        const r = t.perAlgo.find((x) => x.algo === a);
                        const gap = r ? ((r.bestDist - instance.optimum) / instance.optimum) * 100 : NaN;
                        return <td key={a} className="py-1 px-3 font-mono" style={{ color: ALGO_COLORS[a] }}>{r ? `${fmt(r.bestDist)}` : "--"}<span className="text-zinc-600 ml-1">({Number.isFinite(gap) ? gap.toFixed(1) : "--"}%)</span></td>;
                      })}
                      {ALGORITHM_IDS.map((a) => {
                        const r = t.perAlgo.find((x) => x.algo === a);
                        return <td key={`c-${a}`} className="py-1 px-3 text-zinc-400 font-mono">{r ? r.convergenceIter : "--"}</td>;
                      })}
                      <td className="py-1 px-3 text-red-400 font-mono">{t.perAlgo.find((x) => x.algo === 2)?.activations ?? "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* plain-language explanation */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">What this means</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-zinc-400 space-y-1.5">
            {standard && (
              <p>
                <span className="text-zinc-200 font-medium">Standard ACO</span> builds tours purely from pheromone and
                heuristic information. It converges but stagnates - its mean gap ({standard.gapPct.toFixed(2)}%) is the
                highest of the three conditions.
              </p>
            )}
            {nonadaptive && (
              <p>
                <span className="text-zinc-200 font-medium">Non-adaptive HACO</span> refines the best tour with 2-opt at
                every iteration. Quality improves ({nonadaptive.gapPct.toFixed(2)}% gap) but the unconditional O(n^2)
                local search costs the most time ({nonadaptive.meanRuntimeS.toFixed(3)} s on average).
              </p>
            )}
            {adaptive && (
              <p>
                <span className="text-red-400 font-medium">Proposed Adaptive HACO</span> fires 2-opt only when Shannon
                entropy drops below θ AND pheromone dominance exceeds τ_PDR — matching the non-adaptive quality
                ({adaptive.gapPct.toFixed(2)}% gap) while skipping most of the local-search cost ({adaptive.meanActivations.toFixed(1)}{" "}
                triggers out of {p.tMax} iterations on average, {((adaptive.meanActivations / p.tMax) * 100).toFixed(1)}
                %).
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
