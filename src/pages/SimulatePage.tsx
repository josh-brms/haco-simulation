import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useSimStore, PHASE_LABELS, type SimPhase } from "@/stores/simStore";
import { ALGO_NAMES, ALGO_COLORS, ALGORITHM_IDS, type AlgoId } from "@/sim/engine";
import { INSTANCES, INSTANCE_NAMES } from "@/sim/instances";
import Map3D from "@/components/three/Map3D";
import CodePanel from "@/components/run/CodePanel";
import { PHASE_LINES } from "@/components/run/codeSnippets";
import { ConvergenceChart, EntropyChart, PdrChart, type SeriesHistory } from "@/components/run/Charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Label, Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import { fmt } from "@/lib/utils";
import { toTrailEdges, EMPTY_TRAIL_EDGES } from "@/lib/trails";
import { useChartTick } from "@/hooks/useChartTick";

const CODE_FILE_BY_ALGO: Record<AlgoId, string> = {
  0: "standard_aco",
  1: "nonadaptive_haco",
  2: "adaptive_haco",
};

const PHASE_ORDER: SimPhase[] = ["init", "construct", "update", "signals", "trigger", "twoopt"];

export default function SimulatePage() {
  const instanceName = useSimStore((s) => s.instanceName);
  const algo = useSimStore((s) => s.algo);
  const status = useSimStore((s) => s.status);
  const preparing = useSimStore((s) => s.preparing);
  const engine = useSimStore((s) => s.engine);
  const frame = useSimStore((s) => s.frame);
  const phase = useSimStore((s) => s.phase);
  const logs = useSimStore((s) => s.logs);
  const flashCount = useSimStore((s) => s.flashCount);
  const vars = useSimStore((s) => s.vars);
  const iterationsPerSecond = useSimStore((s) => s.iterationsPerSecond);
  const setInstance = useSimStore((s) => s.setInstance);
  const setAlgo = useSimStore((s) => s.setAlgo);
  const setIterationsPerSecond = useSimStore((s) => s.setIterationsPerSecond);
  const play = useSimStore((s) => s.play);
  const pause = useSimStore((s) => s.pause);
  const stepOnce = useSimStore((s) => s.stepOnce);
  const scrubTo = useSimStore((s) => s.scrubTo);
  const reset = useSimStore((s) => s.reset);
  const advance = useSimStore((s) => s.advance);

  const [rateInput, setRateInput] = useState(20);

  // playback loop
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const carryRef = useRef(0);
  useEffect(() => {
    if (status !== "playing") return;
    const loop = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      carryRef.current += dt * iterationsPerSecond;
      while (carryRef.current >= 1) {
        advance();
        carryRef.current -= 1;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
      carryRef.current = 0;
    };
  }, [status, iterationsPerSecond, advance]);

  const instance = INSTANCES[instanceName];

  // highlighted code line from the current phase
  const highlightLine = useMemo(() => {
    const ranges = PHASE_LINES[CODE_FILE_BY_ALGO[algo]];
    const range = ranges?.[phase];
    return range ? range[0] : 0;
  }, [algo, phase]);

  const chartTick = useChartTick(5);

  const trailEdges = useMemo(
    () => (engine ? toTrailEdges(engine.strongEdges(), engine.n) : EMPTY_TRAIL_EDGES),
    // recomputed on the chart tick, not on every animation frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, chartTick]
  );

  const histories: SeriesHistory[] = useMemo(() => {
    if (!engine) return [];
    return [
      {
        algo: engine.algo,
        best: engine.best,
        entropy: engine.entropy,
        dominance: engine.dominance,
        triggered: engine.triggered,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, chartTick]);

  const started = status !== "config" && engine !== null;
  const phaseDone = (p: SimPhase) => PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase);
  const phaseActive = (p: SimPhase) => p === phase;

  return (
    <div className="h-screen flex flex-col relative">
      {preparing && <Loader label={engine ? "Fast-forwarding simulation" : "Preparing simulation engine"} />}
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Simulation</h1>
          <Badge variant={status === "playing" ? "success" : status === "done" ? "default" : "secondary"}>
            {status}
          </Badge>
          {started && (
            <span className="text-xs text-zinc-500">
              Iter {frame}/{engine?.params.tMax} &middot; {PHASE_LABELS[phase]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(!started || status === "paused") && (
            <Button onClick={play} data-testid="sim-play">
              <Play className="w-4 h-4" /> {started ? "Play" : "Start Simulation"}
            </Button>
          )}
          {status === "playing" && (
            <Button variant="secondary" onClick={pause} data-testid="sim-pause">
              <Pause className="w-4 h-4" /> Pause
            </Button>
          )}
          {started && status !== "done" && (
            <Button variant="secondary" onClick={stepOnce} data-testid="sim-step">
              <SkipForward className="w-4 h-4" /> Step
            </Button>
          )}
          {started && (
            <Button variant="ghost" onClick={reset} data-testid="sim-reset">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* LEFT: configuration + code stepper + variables */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900/40 flex flex-col min-h-0">
          <div className="p-3 border-b border-zinc-800 space-y-3">
            <div>
              <Label>Instance</Label>
              <Select
                value={instanceName}
                disabled={status === "playing"}
                onChange={(e) => setInstance(e.target.value as typeof instanceName)}
              >
                {INSTANCE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Algorithm</Label>
                <Select
                  value={algo}
                  disabled={status === "playing"}
                  onChange={(e) => setAlgo(Number(e.target.value) as AlgoId)}
                >
                  {ALGORITHM_IDS.map((a) => (
                    <option key={a} value={a}>
                      {ALGO_NAMES[a]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Iters / sec</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  data-testid="sim-rate"
                  value={rateInput}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    if (!Number.isFinite(raw) || raw < 1) return;
                    const v = Math.min(200, Math.floor(raw));
                    setRateInput(v);
                    setIterationsPerSecond(v);
                  }}
                />
              </div>
            </div>
          </div>

          <CodePanel
            fileKey={CODE_FILE_BY_ALGO[algo]}
            highlightLine={highlightLine}
            autoScroll
            className="flex-1 min-h-0 rounded-none border-0"
          />

          {/* variable inspector */}
          <div className="border-t border-zinc-800 p-3 font-mono text-[11px] space-y-1 bg-zinc-950" data-testid="var-inspector">
            <p className="text-zinc-500 font-sans font-medium mb-1.5">Variables</p>
            <Var label="H(S)" value={vars.entropy.toFixed(2)} hot={started && vars.entropy < vars.theta} />
            <Var label="θ" value={vars.theta.toFixed(2)} />
            <Var label="PDR" value={vars.dominance.toFixed(2)} hot={started && vars.dominance > vars.tauPdr} />
            <Var label="τ_PDR" value={vars.tauPdr.toFixed(2)} />
            <Var label="Best L*" value={fmt(vars.bestLen)} />
            <Var label="Triggered" value={vars.triggered ? "YES" : "no"} hot={vars.triggered} pulse={vars.triggered} />
          </div>
        </aside>

        {/* CENTER: 3D map + scrubber + run structure + mini charts */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 relative">
            <Map3D
              key={instanceName}
              coords={instance.coords}
              bestTour={engine && frame > 0 ? engine.bestTourAt.slice((frame - 1) * engine.n, frame * engine.n) : null}
              trails={trailEdges}
              algoColor={ALGO_COLORS[algo]}
              antCount={30}
              antSpeed={0.08}
              antsActive={status === "playing"}
              version={frame}
              flashFrame={flashCount}
            />
            {flashCount > 0 && (
              <div
                key={flashCount}
                className="twoopt-burst absolute inset-0 rounded-none"
                style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, transparent 70%)" }}
              />
            )}
            <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur rounded-md px-3 py-1.5 text-xs text-zinc-300 border border-zinc-800">
              {ALGO_NAMES[algo]} &middot; {instanceName} &middot; seed {engine?.params.seed ?? "-"}
            </div>
          </div>

          {/* scrubber */}
          <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 w-14">Scrub</span>
            <input
              type="range"
              min={0}
              max={engine?.params.tMax ?? 500}
              value={frame}
              data-testid="sim-scrubber"
              className="flex-1 accent-green-500"
              onChange={(e) => scrubTo(Number(e.target.value))}
            />
            <span className="text-[11px] text-zinc-400 w-20 text-right">
              {frame} / {engine?.params.tMax ?? 500}
            </span>
          </div>

          {/* run structure pipeline */}
          <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2">
            <p className="text-[11px] font-medium text-zinc-400 mb-2">Run Structure</p>
            <div className="flex flex-wrap gap-1.5">
              {PHASE_ORDER.map((p) => (
                <span
                  key={p}
                  data-testid={`phase-${p}`}
                  className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                    phaseActive(p)
                      ? "border-green-600/50 bg-green-600/20 text-green-300 animate-pop"
                      : phaseDone(p)
                        ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                        : "border-zinc-800 text-zinc-600"
                  }`}
                >
                  {phaseDone(p) ? "+ " : ""}
                  {PHASE_LABELS[p]}
                </span>
              ))}
            </div>
          </div>

          {/* mini charts */}
          <div className="h-36 border-t border-zinc-800 grid grid-cols-3 gap-px bg-zinc-800">
            <MiniChart label="Convergence L*(t)">
              <ConvergenceChart histories={histories} instance={instance} />
            </MiniChart>
            <MiniChart label="H(S) vs θ">
              <EntropyChart histories={histories} instance={instance} />
            </MiniChart>
            <MiniChart label="PDR vs τ_PDR">
              <PdrChart histories={histories} instance={instance} />
            </MiniChart>
          </div>
        </section>

        {/* RIGHT: process log */}
        <aside className="w-72 border-l border-zinc-800 bg-zinc-900/40 flex flex-col min-h-0">
          <div className="p-3 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-300">Process Log</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10.5px]" data-testid="process-log">
            {logs.length === 0 && <p className="text-zinc-600 font-sans text-xs p-2">Waiting for events...</p>}
            {logs.map((log, i) => (
              <div
                key={`${log.iter}-${i}`}
                className={`animate-slide-in rounded px-2 py-1.5 border ${
                  log.level === "trigger"
                    ? "border-red-600/40 bg-red-600/10 text-red-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400"
                }`}
              >
                <span className="text-zinc-600">t={log.iter}</span> {log.text}
              </div>
            ))}
          </div>
          {engine && (
            <div className="border-t border-zinc-800 p-3 text-[11px] text-zinc-400 space-y-1">
              <Row label="2-opt activations" value={String(engine.activations)} />
              <Row label="Known optimum" value={instance.optimum.toLocaleString()} />
              <Row label="θ (entropy threshold)" value={instance.entropyTheta.toFixed(2)} />
              <Row label="Convergence iteration" value={String(engine.convergenceIteration())} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Var({ label, value, hot, pulse }: { label: string; value: string; hot?: boolean; pulse?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`${hot ? "text-red-400 font-bold" : "text-zinc-300"} ${pulse ? "pulse-soft" : ""}`}>
        {value}
      </span>
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

function MiniChart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-zinc-950 p-2 min-h-0 flex flex-col">
      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
