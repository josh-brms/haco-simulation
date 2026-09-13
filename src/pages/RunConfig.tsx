import { useEffect, useState } from "react";
import { Play, SlidersHorizontal } from "lucide-react";
import { useRunStore } from "@/stores/runStore";
import { INSTANCES, INSTANCE_NAMES, type InstanceName } from "@/sim/instances";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Label, Input } from "@/components/ui/input";
import Loader from "@/components/ui/Loader";
import EngineToggle from "@/components/run/EngineToggle";

const clamp = (v: number, lo?: number, hi?: number) => {
  let out = v;
  if (lo !== undefined) out = Math.max(lo, out);
  if (hi !== undefined) out = Math.min(hi, out);
  return out;
};

interface NumericProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

/**
 * Numeric field that tolerates in-progress edits: an empty or partial value
 * ("", "-", "1.") never snaps back mid-typing; clamping happens only once a
 * complete number is entered (or on blur), so clearing "30" and typing "2"
 * yields 2 instead of 12.
 */
function Numeric({ id, label, value, onChange, min, max }: NumericProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // follow external value changes (store resets) while not being edited
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const partial = text === "" || text === "-" || text === "." || text.endsWith(".");

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    const bounded = clamp(parsed, min, max);
    onChange(bounded);
    // snap the text only when clamping actually changed the number,
    // so natural typing like "1.05" is not interrupted
    if (bounded !== parsed) setText(String(bounded));
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        data-testid={id}
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (partial) {
            setText(String(value));
          } else {
            commit(text);
            setText(String(value));
          }
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.eE+-]/g, "");
          setText(raw);
          if (!partial && raw !== "" && raw !== "-") commit(raw);
        }}
      />
    </div>
  );
}

/**
 * Stage 1 of the Run page: parameter configuration, shown before any
 * visualization. Covers problem selection, experiment design, algorithm
 * parameters, and playback speed.
 */
export default function RunConfig() {
  const instanceName = useRunStore((s) => s.instanceName);
  const engine = useRunStore((s) => s.engine);
  const params = useRunStore((s) => s.params);
  const trialCount = useRunStore((s) => s.trialCount);
  const playbackSpeed = useRunStore((s) => s.playbackSpeed);
  const setInstance = useRunStore((s) => s.setInstance);
  const setEngine = useRunStore((s) => s.setEngine);
  const setParam = useRunStore((s) => s.setParam);
  const setTrialCount = useRunStore((s) => s.setTrialCount);
  const setPlaybackSpeed = useRunStore((s) => s.setPlaybackSpeed);
  const startRun = useRunStore((s) => s.startRun);
  const preparing = useRunStore((s) => s.preparing);

  const instance = INSTANCES[instanceName];

  return (
    <div className="h-screen flex flex-col relative">
      {preparing && <Loader label="Preparing benchmark engines" />}
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3">
        <h1 className="text-lg font-semibold text-zinc-100">Benchmark Configuration</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-3xl grid md:grid-cols-2 gap-4">
          {/* Problem instance */}
          <Card className="md:col-span-2 animate-card-in" style={{ animationDelay: "0ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-green-500" />
                Problem Instance
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="instance">TSPLIB instance</Label>
                <Select
                  id="instance"
                  data-testid="instance-select"
                  value={instanceName}
                  onChange={(e) => setInstance(e.target.value as InstanceName)}
                >
                  {INSTANCE_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name} ({INSTANCES[name].nodes} nodes)
                    </option>
                  ))}
                </Select>
              </div>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>
                  Known optimum: <span className="text-zinc-200 font-medium">{instance.optimum.toLocaleString()}</span>
                </p>
                <p>
                  Entropy threshold (θ):{" "}
                  <span className="text-zinc-200 font-medium">{instance.entropyTheta.toFixed(2)}</span>
                  <span className="text-zinc-600"> · 30th percentile</span>
                </p>
              </div>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>
                  PDR threshold (τ_PDR): <span className="text-zinc-200 font-medium">{instance.pdrThreshold}</span>
                </p>
                <p className="text-zinc-600">Euclidean 2D, dense distance matrix</p>
              </div>
            </CardContent>
          </Card>

          {/* Engine selector */}
          <Card className="animate-card-in" style={{ animationDelay: "35ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <EngineToggle value={engine} onChange={setEngine} disabled={preparing} />
            </CardContent>
          </Card>

          {/* Experiment design */}
          <Card className="animate-card-in" style={{ animationDelay: "70ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Experiment Design</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Numeric
                id="trials"
                label="Independent trials"
                value={trialCount}
                onChange={(v) => setTrialCount(Math.floor(v))}
                min={1}
                max={100}
              />
              <Numeric
                id="tmax"
                label="T_max (iterations)"
                value={params.tMax}
                onChange={(v) => setParam("tMax", clamp(Math.floor(v), 1, 2000))}
                min={1}
                max={2000}
              />
              <Numeric
                id="ants"
                label="Ants per iteration (m)"
                value={params.ants}
                onChange={(v) => setParam("ants", clamp(Math.floor(v), 5, 100))}
                min={5}
                max={100}
              />
              <Numeric
                id="seed"
                label="Base seed"
                value={params.seed}
                onChange={(v) => setParam("seed", Math.max(0, Math.floor(v)))}
                min={0}
              />
              <p className="col-span-2 text-[11px] text-zinc-500 leading-relaxed">
                Trial i of every algorithm uses seed {params.seed} + i (paired design for the statistical tests).
              </p>
            </CardContent>
          </Card>

          {/* Algorithm parameters */}
          <Card className="animate-card-in" style={{ animationDelay: "140ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Algorithm Parameters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Numeric
                id="alpha"
                label="α - pheromone weight"
                value={params.alpha}
                onChange={(v) => setParam("alpha", clamp(v, 0, 10))}
                min={0}
                max={10}
              />
              <Numeric
                id="beta"
                label="β - heuristic weight"
                value={params.beta}
                onChange={(v) => setParam("beta", clamp(v, 0, 10))}
                min={0}
                max={10}
              />
              <Numeric
                id="rho"
                label="ρ - evaporation rate"
                value={params.rho}
                onChange={(v) => setParam("rho", clamp(v, 0.01, 0.99))}
                min={0.01}
                max={0.99}
              />
              <Numeric
                id="q"
                label="Q - deposit constant"
                value={params.Q}
                onChange={(v) => setParam("Q", clamp(v, 0.01, 100))}
                min={0.01}
                max={100}
              />
              <div className="col-span-2">
                <Label>Playback speed</Label>
                <div className="flex gap-1">
                  {[1, 2, 4, 8].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={playbackSpeed === s ? "default" : "secondary"}
                      onClick={() => setPlaybackSpeed(s)}
                      className="flex-1"
                    >
                      {s}x
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary + start */}
          <Card className="md:col-span-2 border-green-600/30 animate-card-in" style={{ animationDelay: "210ms" }}>
            <CardContent className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Ready to run{" "}
                <span className="text-zinc-100 font-medium">
                  3 algorithms x {trialCount} trials = {3 * trialCount} runs
                </span>{" "}
                on <span className="text-zinc-100 font-medium">{instanceName}</span>, {params.tMax} iterations each.
                <p className="text-zinc-600 mt-0.5">
                  Engine: <span className="text-zinc-400">{engine === "python" ? "Python (NumPy PCG64 - thesis exact)" : "TypeScript (Mulberry32)"}</span>
                </p>
              </div>
              <Button size="lg" onClick={startRun} data-testid="start-btn">
                <Play className="w-4 h-4" /> Start Benchmark
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
