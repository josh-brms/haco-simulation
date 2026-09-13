import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Play, Pause, RotateCcw, SlidersHorizontal, Zap } from "lucide-react";
import { useRunStore, aggregateTrials } from "@/stores/runStore";
import RunConfig from "@/pages/RunConfig";
import { useResultsStore } from "@/stores/resultsStore";
import type { StoredRun } from "@/stores/resultsStore";
import { ALGO_NAMES, ALGO_COLORS, ALGORITHM_IDS, type AlgoId } from "@/sim/engine";
import { INSTANCES } from "@/sim/instances";
import Map3D from "@/components/three/Map3D";
import {
  ConvergenceChart,
  EntropyChart,
  PdrChart,
  ComparisonChart,
  type SeriesHistory,
  type ComparisonDatum,
} from "@/components/run/Charts";
import CodePanel from "@/components/run/CodePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import { fmt } from "@/lib/utils";
import { toTrailEdges, EMPTY_TRAIL_EDGES } from "@/lib/trails";
import { CODE_FILES } from "@/components/run/codeSnippets";
import { useChartTick } from "@/hooks/useChartTick";

const CODE_FILE_BY_ALGO: Record<AlgoId, string> = {
  0: "standard_aco",
  1: "nonadaptive_haco",
  2: "adaptive_haco",
};

export default function RunPage() {
  const status = useRunStore((s) => s.status);
  return status === "config" ? <RunConfig /> : <VisualStage />;
}

/**
 * Stage 2 of the Run page: live visualization. Shown after the parameters
 * stage; renders the 3D map, real-time charts, progress, and source code.
 */
function VisualStage() {
  const status = useRunStore((s) => s.status);
  const instanceName = useRunStore((s) => s.instanceName);
  const engineType = useRunStore((s) => s.engine);
  const params = useRunStore((s) => s.params);
  const trialCount = useRunStore((s) => s.trialCount);
  const playbackSpeed = useRunStore((s) => s.playbackSpeed);
  const engines = useRunStore((s) => s.engines);
  const currentTrial = useRunStore((s) => s.currentTrial);
  const frame = useRunStore((s) => s.frame);
  const edgeCache = useRunStore((s) => s.edgeCache);
  const flashCount = useRunStore((s) => s.flashCount);
  const trials = useRunStore((s) => s.trials);
  const preparing = useRunStore((s) => s.preparing);
  const setPlaybackSpeed = useRunStore((s) => s.setPlaybackSpeed);
  const pause = useRunStore((s) => s.pause);
  const resume = useRunStore((s) => s.resume);
  const stop = useRunStore((s) => s.stop);
  const advance = useRunStore((s) => s.advance);
  const addRun = useResultsStore((s) => s.addRun);

  const [activeAlgo, setActiveAlgo] = useState<AlgoId>(2);
  const savedRef = useRef(false);

  const instance = INSTANCES[instanceName];
  const engine = engines.find((e) => e.algo === activeAlgo) ?? engines[0] ?? null;

  // simulation loop, ~30 ticks per second
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  useEffect(() => {
    if (status !== "running") return;
    const loop = (ts: number) => {
      if (ts - lastTickRef.current > 33) {
        advance();
        lastTickRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, advance]);

  // archive the run once every trial completed
  useEffect(() => {
    if (status === "running") savedRef.current = false;
    if (status === "completed" && !savedRef.current && trials.length > 0) {
      savedRef.current = true;
      const run: Omit<StoredRun, "id" | "timestamp"> = {
        instanceName,
        params: { ...params, trials: trialCount },
        trialsData: trials.map((t) => ({
          trial: t.trial,
          seed: t.seed,
          perAlgo: t.perAlgo.map((r) => ({ ...r })),
          series: t.series.map((s) => ({ ...s })),
        })),
      };
      addRun(run);
    }
  }, [status, trials, instanceName, params, addRun]);

  const bestTour = useMemo(() => {
    if (!engine || engine.bestTourAt.length === 0) return null;
    const n = engine.n;
    const f = Math.max(0, frame - 1);
    const slice = engine.bestTourAt.slice(f * n, f * n + n);
    return slice.some((v) => v >= 0) ? slice : null;
  }, [engine, frame]);

  const trailEdges = useMemo(
    () => (engine ? toTrailEdges(edgeCache[activeAlgo], engine.n) : EMPTY_TRAIL_EDGES),
    [engine, edgeCache, activeAlgo]
  );

  // chart series re-derive at 5 Hz; the engines' arrays mutate in place
  const chartTick = useChartTick(5);
  const histories: SeriesHistory[] = useMemo(
    () =>
      engines.map((e) => ({
        algo: e.algo,
        best: e.best,
        entropy: e.entropy,
        dominance: e.dominance,
        triggered: e.triggered,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engines, chartTick]
  );

  const comparisonData: ComparisonDatum[] = useMemo(() => {
    if (trials.length === 0) return [];
    return aggregateTrials(instanceName, trials).map((a) => ({
      name: a.name,
      quality: a.meanBest,
      time: a.meanRuntimeS,
      activations: a.meanActivations,
    }));
  }, [trials, instanceName]);

  const progress = params.tMax > 0 ? Math.min(100, (frame / params.tMax) * 100) : 0;
  const currentBest = engine ? engine.currentBest : Infinity;

  // flash the best-L* value whenever the tour improves
  const [flashKey, setFlashKey] = useState(0);
  const prevBestRef = useRef(Infinity);
  useEffect(() => {
    if (Number.isFinite(currentBest) && currentBest < prevBestRef.current - 1e-9) {
      setFlashKey((k) => k + 1);
    }
    if (currentBest < prevBestRef.current) prevBestRef.current = currentBest;
  }, [currentBest]);

  return (
    <div className="h-screen flex flex-col relative">
      {preparing && <Loader label={currentTrial === 0 ? "Preparing benchmark engines" : `Preparing trial ${currentTrial + 1}`} />}
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Benchmark Run</h1>
          <Badge variant={status === "running" ? "success" : status === "completed" ? "default" : "secondary"}>
            {status === "running" && <span className="live-dot mr-1.5" aria-hidden="true" />}
            {status}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {engineType === "python" ? "Python / NumPy PCG64" : "TypeScript / Mulberry32"}
          </Badge>
          <span className="text-xs text-zinc-500">
            Trial {Math.min(currentTrial + 1, trialCount)}/{trialCount} &middot; Iter {frame}/{params.tMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status === "running" && (
            <Button variant="secondary" onClick={pause} data-testid="pause-btn">
              <Pause className="w-4 h-4" /> Pause
            </Button>
          )}
          {status === "paused" && (
            <Button onClick={resume} data-testid="resume-btn">
              <Play className="w-4 h-4" /> Resume
            </Button>
          )}
          {status === "completed" ? (
            <Button onClick={stop} data-testid="new-run-btn">
              <SlidersHorizontal className="w-4 h-4" /> New Run
            </Button>
          ) : (
            <Button variant="ghost" onClick={stop} data-testid="stop-btn">
              <RotateCcw className="w-4 h-4" /> Stop
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* LEFT: progress + parameters in effect */}
        <aside className="w-72 border-r border-zinc-800 bg-zinc-900/40 p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden shimmer-track" data-testid="progress-bar">
                <div className="h-full bg-green-500 transition-all duration-150" style={{ width: `${progress}%` }} />
                {status === "running" && <div className="shimmer-bar" aria-hidden="true" />}
              </div>
              <div className="text-xs text-zinc-400 flex justify-between">
                <span>{progress.toFixed(0)}%</span>
                <span>
                  {frame}/{params.tMax}
                </span>
              </div>
              {engine && (
                <div className="text-xs text-zinc-500 space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Best L* ({ALGO_NAMES[activeAlgo]})</span>
                    <span key={flashKey} className="text-zinc-300 improvement-flash">
                      {fmt(currentBest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gap to optimum</span>
                    <span className="text-zinc-300">
                      {Number.isFinite(currentBest)
                        ? `${(((currentBest - instance.optimum) / instance.optimum) * 100).toFixed(2)}%`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>2-opt activations</span>
                    <span className="text-zinc-300">{engine.activations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engine time</span>
                    <span className="text-zinc-300">{engine.runtimeS.toFixed(2)} s</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parameters in effect</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-400 space-y-1">
              <Row label="Instance" value={instanceName} />
              <Row label="T_max / m" value={`${params.tMax} / ${params.ants}`} />
              <Row label="α / β" value={`${params.alpha} / ${params.beta}`} />
              <Row label="ρ / Q" value={`${params.rho} / ${params.Q}`} />
              <Row label="θ / τ_PDR" value={`${instance.entropyTheta.toFixed(1)} / ${instance.pdrThreshold}`} />
              <Row label="Optimum" value={instance.optimum.toLocaleString()} />
              <div className="pt-2">
                <Label>Playback speed</Label>
                <div className="flex gap-1">
                  {[1, 2, 4, 8].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={playbackSpeed === s ? "default" : "secondary"}
                      onClick={() => setPlaybackSpeed(s)}
                      className="flex-1 h-7"
                    >
                      {s}x
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER: 3D map + charts */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
            <Zap className="w-4 h-4 text-green-500" />
            {ALGORITHM_IDS.map((a) => (
              <button
                key={a}
                data-testid={`algo-tab-${a}`}
                onClick={() => setActiveAlgo(a)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                  activeAlgo === a
                    ? "border-green-600/50 bg-green-600/15 text-green-400"
                    : "border-transparent text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: ALGO_COLORS[a] }} />
                {ALGO_NAMES[a]}
              </button>
            ))}
          </div>

          <div className="h-[46%] min-h-[280px] border-b border-zinc-800 relative">
            <Map3D
              key={instanceName}
              coords={instance.coords}
              bestTour={bestTour}
              trails={trailEdges}
              algoColor={ALGO_COLORS[activeAlgo]}
              antCount={Math.min(params.ants, 30)}
              antSpeed={0.06 * playbackSpeed}
              antsActive={status === "running"}
              version={frame}
              flashFrame={flashCount[activeAlgo]}
            />
            <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur rounded-md px-3 py-1.5 text-xs text-zinc-300 border border-zinc-800">
              {ALGO_NAMES[activeAlgo]} &middot; {instanceName}
            </div>
          </div>
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-px bg-zinc-800">
            <ChartCell label="Convergence: best L*(t)" testId="chart-convergence">
              <ConvergenceChart histories={histories} instance={instance} />
            </ChartCell>
            <ChartCell label="Shannon Entropy H(S) vs θ" testId="chart-entropy">
              <EntropyChart histories={histories} instance={instance} />
            </ChartCell>
            <ChartCell label="PDR(t) vs τ_PDR" testId="chart-pdr">
              <PdrChart histories={histories} instance={instance} />
            </ChartCell>
          </div>

          {comparisonData.length > 0 && (
            <div className="h-44 border-t border-zinc-800 bg-zinc-950 p-2">
              <p className="text-[11px] font-medium text-zinc-400 mb-1">
                Algorithm comparison - mean over {trials.length} completed trial{trials.length > 1 ? "s" : ""}
              </p>
              <div className="h-[calc(100%-20px)]">
                <ComparisonChart data={comparisonData} />
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: source code */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-900/40 flex flex-col min-h-0">
          <div className="flex items-center gap-1 p-2 border-b border-zinc-800">
            {ALGORITHM_IDS.map((a) => {
              const fileKey = CODE_FILE_BY_ALGO[a];
              return (
                <button
                  key={a}
                  onClick={() => setActiveAlgo(a)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    activeAlgo === a ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {CODE_FILES[fileKey].label.replace("Standard ", "").replace("Non-adaptive ", "").replace("Adaptive ", "")}
                </button>
              );
            })}
          </div>
          <CodePanel fileKey={CODE_FILE_BY_ALGO[activeAlgo]} className="flex-1 min-h-0 rounded-none border-0" />
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}

function ChartCell({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="bg-zinc-950 p-2 min-h-0 flex flex-col">
      <p className="text-[11px] font-medium text-zinc-400 mb-1">{label}</p>
      <div className="flex-1 min-h-0" data-testid={testId}>
        {children}
      </div>
    </div>
  );
}
