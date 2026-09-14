import { create } from "zustand";
import {
  AlgoEngine,
  ALGORITHM_IDS,
  ALGO_KEYS,
  ALGO_NAMES,
  CONVERGENCE_EPSILON,
  CONVERGENCE_WINDOW,
  type AlgoId,
  type BenchmarkParams,
  type EdgeWeights,
  type FrameSnapshot,
  DEFAULT_PARAMS,
} from "@/sim/engine";
import { INSTANCES, type InstanceName } from "@/sim/instances";
import {
  runPythonTrial,
  isTauri,
  type PythonTrialResult,
  type PythonTourSnapshot,
} from "@/lib/native";

export type RunStatus = "config" | "running" | "paused" | "completed";

export type EngineType = "typescript" | "python";

/** One completed trial across all three algorithm conditions. */
export interface CompletedTrial {
  trial: number;
  seed: number;
  perAlgo: {
    algo: AlgoId;
    bestDist: number;
    convergenceIter: number;
    activations: number;
    runtimeS: number;
  }[];
  series: {
    algo: AlgoId;
    best: number[];
    entropy: number[];
    dominance: number[];
    triggered: boolean[];
  }[];
}

const EMPTY_EDGES: EdgeWeights = { i: new Int32Array(0), j: new Int32Array(0), w: new Float32Array(0), count: 0 };

const emptyEdgeMap = (): Record<AlgoId, EdgeWeights> => ({ 0: EMPTY_EDGES, 1: EMPTY_EDGES, 2: EMPTY_EDGES });

interface RunState {
  /** "config" shows the parameter form; every other status shows the visuals. */
  status: RunStatus;
  /** True while engines are being constructed (loader overlay shows). */
  preparing: boolean;
  instanceName: InstanceName;
  /** Which simulation engine to use. */
  engine: EngineType;
  /** Pure algorithm parameters (alpha, beta, rho, Q, m, T_max, seed base). */
  params: BenchmarkParams;
  /** Number of independent trials in the experiment design. */
  trialCount: number;
  playbackSpeed: number;

  engines: AlgoEngine[];
  currentTrial: number;
  frame: number;
  edgeCache: Record<AlgoId, EdgeWeights>;
  flashCount: Record<AlgoId, number>;
  trials: CompletedTrial[];
  /** Raw Python output per trial (tours included) for playback; not archived. */
  pythonRaw: PythonTrialResult[][];
  /** Bumps every startRun/stop so stale background fetches abort. */
  pythonRunId: number;
  /** Visible Python bridge failure; null when healthy. */
  runError: string | null;
  /** Non-blocking fetch progress for Python engine (null when not fetching). */
  pythonFetchProgress: { done: number; total: number } | null;

  setInstance: (name: InstanceName) => void;
  setEngine: (engine: EngineType) => void;
  setParam: <K extends keyof BenchmarkParams>(key: K, value: BenchmarkParams[K]) => void;
  setTrialCount: (count: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  startRun: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Advance every engine by playbackSpeed iterations. */
  advance: () => void;
}

let prepareTimer: ReturnType<typeof setTimeout> | undefined;
const clearPrepareTimer = () => {
  if (prepareTimer !== undefined) {
    clearTimeout(prepareTimer);
    prepareTimer = undefined;
  }
};

function makeEngines(instanceName: InstanceName, params: BenchmarkParams, trial: number): AlgoEngine[] {
  const instance = INSTANCES[instanceName];
  return ALGORITHM_IDS.map((algo) => new AlgoEngine(algo, instance, params, params.seed + trial));
}

/** Normalized sparse tour snapshot: best tour known at a given frame. */
interface NormalizedTourSnapshot {
  frame: number;
  tour: number[];
}

function normalizeTourSnapshots(
  snapshots: Array<PythonTourSnapshot | [number, number[]]> | undefined,
  n: number
): NormalizedTourSnapshot[] {
  if (!Array.isArray(snapshots)) return [];
  const out: NormalizedTourSnapshot[] = [];
  for (const s of snapshots) {
    if (Array.isArray(s)) {
      const [frame, tour] = s as [number, number[]];
      if (Number.isInteger(frame) && Array.isArray(tour) && tour.length === n) {
        out.push({ frame, tour });
      }
      continue;
    }
    const frame = (s as PythonTourSnapshot).frame;
    const tour = (s as PythonTourSnapshot).tour;
    if (Number.isInteger(frame) && Array.isArray(tour) && tour.length === n) {
      out.push({ frame, tour });
    }
  }
  return out.sort((a, b) => a.frame - b.frame);
}

/**
 * Reconstruct the best-tour-at-every-frame buffer from sparse snapshots.
 * Frames before the first snapshot stay -1 (no tour yet), matching the
 * empty state the live engine shows before its first improvement.
 */
export function reconstructBestTourAt(
  n: number,
  tMax: number,
  snapshots: Array<PythonTourSnapshot | [number, number[]]> | undefined,
  bestFinal: number[] | undefined
): Int32Array {
  const out = new Int32Array(tMax * n).fill(-1);
  const valid = normalizeTourSnapshots(snapshots, n);
  let cur: number[] | null = null;
  let idx = 0;
  while (idx < valid.length && valid[idx].frame < 0) {
    cur = valid[idx].tour;
    idx++;
  }
  for (let f = 0; f < tMax; f++) {
    while (idx < valid.length && valid[idx].frame <= f) {
      cur = valid[idx].tour;
      idx++;
    }
    if (cur) out.set(cur, f * n);
  }
  if (!cur && Array.isArray(bestFinal) && bestFinal.length === n) {
    for (let f = 0; f < tMax; f++) out.set(bestFinal, f * n);
  }
  return out;
}

/**
 * Virtual engine that replays pre-computed Python results through the
 * same step()/advance() interface the TypeScript engine uses. Scalar
 * series are revealed progressively (arrays grow on step(), mirroring
 * AlgoEngine), while the tour buffer is pre-filled so the 3D view can
 * slice it by frame.
 */
export class PythonPlaybackEngine {
  readonly algo: AlgoId;
  readonly n: number;
  /** Revealed prefix of the full series (grows on step(), like AlgoEngine). */
  readonly best: number[] = [];
  readonly entropy: number[] = [];
  readonly dominance: number[] = [];
  readonly triggered: boolean[] = [];
  readonly bestTourAt: Int32Array;
  activations = 0;

  private frame = 0;
  private readonly tMax: number;
  private readonly fullBest: number[];
  private readonly fullEntropy: number[];
  private readonly fullDominance: number[];
  private readonly fullTriggered: boolean[];
  private readonly totalRuntimeS: number;
  
  // Fake pheromone matrix for visual trails (mimics TS engine)
  private readonly tau: Float64Array;

  constructor(
    algo: AlgoId,
    n: number,
    series: { best: number[]; entropy: number[]; dominance: number[]; triggered: boolean[] },
    tMax: number,
    runtimeS: number,
    tourSnapshots?: Array<PythonTourSnapshot | [number, number[]]>,
    bestTourFinal?: number[]
  ) {
    this.algo = algo;
    this.n = n;
    this.tMax = tMax;
    this.fullBest = series.best.slice(0, tMax);
    this.fullEntropy = series.entropy.slice(0, tMax);
    this.fullDominance = series.dominance.slice(0, tMax);
    this.fullTriggered = series.triggered.slice(0, tMax);
    this.totalRuntimeS = runtimeS;
    this.bestTourAt = reconstructBestTourAt(n, tMax, tourSnapshots, bestTourFinal);
    const nn = n * n;
    if (this.bestTourAt[0] !== -1) {
      // Small baseline on all edges so the green web is visible beyond
      // the red tour line. Tour edges get a bonus so they stand out.
      this.tau = new Float64Array(nn).fill(0.15);
      for (let i = 0; i < n; i++) {
        const u = this.bestTourAt[i];
        const v = this.bestTourAt[(i + 1) % n];
        this.tau[u * n + v] += 1.0;
        this.tau[v * n + u] += 1.0;
      }
    } else {
      this.tau = new Float64Array(nn);
    }
  }

  get done(): boolean {
    return this.frame >= this.tMax;
  }

  get currentFrame(): number {
    return this.frame;
  }

  /** Best tour length revealed so far (Infinity before the first frame). */
  get currentBest(): number {
    return this.best.length > 0 ? this.best[this.best.length - 1] : Infinity;
  }

  /** Animated engine time: total spread across playback. */
  get runtimeS(): number {
    if (this.tMax <= 0) return this.totalRuntimeS;
    return (this.totalRuntimeS * Math.min(this.frame, this.tMax)) / this.tMax;
  }

  step(): FrameSnapshot | null {
    if (this.done) return null;
    const f = this.frame;
    const bestLen = this.fullBest[f] ?? Infinity;
    const entropy = this.fullEntropy[f] ?? 0;
    const pdr = this.fullDominance[f] ?? 1;
    const triggerFired = this.fullTriggered[f] ?? false;
    this.best.push(bestLen);
    this.entropy.push(entropy);
    this.dominance.push(pdr);
    this.triggered.push(triggerFired);
    if (triggerFired) this.activations++;

    // Evaporate the tour bonus but clamp back to the baseline so the
    // green web stays visible and doesn't fade to nothing or turn white.
    const BASELINE = 0.15;
    for (let i = 0; i < this.tau.length; i++) {
      if (this.tau[i] > BASELINE) {
        this.tau[i] = BASELINE + (this.tau[i] - BASELINE) * 0.92;
      }
    }

    // Deposit along the best tour so those edges are brightest
    const tourOffset = f * this.n;
    if (this.bestTourAt[tourOffset] !== -1) {
      for (let i = 0; i < this.n; i++) {
        const u = this.bestTourAt[tourOffset + i];
        const v = this.bestTourAt[tourOffset + ((i + 1) % this.n)];
        this.tau[u * this.n + v] += 1.0;
        this.tau[v * this.n + u] += 1.0;
      }
    }

    this.frame++;
    return {
      frame: f,
      bestLen,
      entropy,
      pdr,
      triggerFired,
      bestTour: Int32Array.from(this.bestTourAt.slice(f * this.n, f * this.n + this.n)),
      tau: this.tau,
    };
  }

  convergenceIteration(): number {
    const h = this.fullBest;
    for (let t = CONVERGENCE_WINDOW; t < h.length; t++) {
      const prev = h[t - CONVERGENCE_WINDOW];
      if (prev > 0 && (prev - h[t]) / prev <= CONVERGENCE_EPSILON) return t;
    }
    return h.length;
  }

  /** Trails derived from the currently revealed best tour (tour loop edges). */
  strongEdges(cap = 400): EdgeWeights {
    const { n } = this;
    const idx = new Uint32Array(cap);
    const val = new Float64Array(cap).fill(-1);
    let filled = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const w = this.tau[i * n + j] + this.tau[j * n + i];
        if (w <= 0) continue;
        if (filled < cap || w > val[filled - 1]) {
          let pos = filled < cap ? filled++ : cap - 1;
          while (pos > 0 && val[pos - 1] < w) {
            idx[pos] = idx[pos - 1];
            val[pos] = val[pos - 1];
            pos--;
          }
          idx[pos] = i * n + j;
          val[pos] = w;
        }
      }
    }

    const iOut = new Int32Array(filled);
    const jOut = new Int32Array(filled);
    const wOut = new Float32Array(filled);
    for (let k = 0; k < filled; k++) {
      iOut[k] = (idx[k] / n) | 0;
      jOut[k] = idx[k] % n;
      wOut[k] = val[k];
    }
    return { i: iOut, j: jOut, w: wOut, count: filled };
  }
}

/** Build one playback engine per algorithm from a completed trial + raw Python output. */
export function buildPlaybackEngines(
  instanceName: InstanceName,
  params: BenchmarkParams,
  completed: CompletedTrial,
  raw: PythonTrialResult[]
): PythonPlaybackEngine[] {
  const instance = INSTANCES[instanceName];
  const byAlgo = new Map(raw.map((r) => [r.algo, r]));
  const keyFor: Record<AlgoId, string> = { 0: "standard_aco", 1: "nonadaptive_haco", 2: "adaptive_haco" };
  return ALGORITHM_IDS.map((algo) => {
    const series = completed.series.find((s) => s.algo === algo)!;
    const perAlgo = completed.perAlgo.find((p) => p.algo === algo)!;
    const rawAlgo = byAlgo.get(keyFor[algo]);
    const snapshots: PythonTourSnapshot[] = (rawAlgo?.tour_frames ?? []).map((frame, i) => ({
      frame,
      tour: rawAlgo?.tour_snapshots[i] ?? [],
    }));
    return new PythonPlaybackEngine(
      algo,
      instance.nodes,
      { best: series.best, entropy: series.entropy, dominance: series.dominance, triggered: series.triggered },
      params.tMax,
      perAlgo.runtimeS,
      snapshots,
      rawAlgo?.best_tour_final
    );
  });
}

/** Convert Python trial results into the CompletedTrial format used by the store. */
export function buildPythonTrial(trialIndex: number, seed: number, results: PythonTrialResult[]): CompletedTrial {
  const algoMap: Record<string, AlgoId> = {
    standard_aco: 0,
    nonadaptive_haco: 1,
    adaptive_haco: 2,
  };

  return {
    trial: trialIndex,
    seed,
    perAlgo: results.map((r) => ({
      algo: algoMap[r.algo],
      bestDist: r.best_dist,
      convergenceIter: r.convergence_iter,
      activations: r.n_activations,
      runtimeS: r.time_s,
    })),
    series: results.map((r) => ({
      algo: algoMap[r.algo],
      best: r.best_history,
      entropy: r.entropy_history,
      dominance: r.pdr_history,
      triggered: r.triggered_history,
    })),
  };
}

export const useRunStore = create<RunState>((set, get) => ({
  status: "config",
  preparing: false,
  instanceName: "eil51",
  engine: "python",
  params: { ...DEFAULT_PARAMS },
  trialCount: 30,
  playbackSpeed: 2,

  engines: [],
  currentTrial: 0,
  frame: 0,
  edgeCache: emptyEdgeMap(),
  flashCount: { 0: 0, 1: 0, 2: 0 },
  trials: [],
  pythonRaw: [],
  pythonRunId: 0,
  runError: null,
  pythonFetchProgress: null,

  setInstance: (name) => {
    if (get().status === "running") return;
    set({ instanceName: name });
  },

  setEngine: (engine) => {
    if (get().status === "running") return;
    set({ engine });
  },

  setParam: (key, value) => {
    if (get().status === "running") return;
    set((s) => ({ params: { ...s.params, [key]: value } }));
  },

  setTrialCount: (count) => {
    if (get().status === "running") return;
    set({ trialCount: Math.max(1, Math.min(100, Math.floor(count))) });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  startRun: () => {
    const state = get();
    if (state.preparing || state.status === "running") return;
    clearPrepareTimer();
    const runId = state.pythonRunId + 1;
    set({
      status: "config",
      preparing: true,
      engines: [],
      currentTrial: 0,
      frame: 0,
      edgeCache: emptyEdgeMap(),
      flashCount: { 0: 0, 1: 0, 2: 0 },
      trials: [],
      pythonRaw: [],
      pythonRunId: runId,
      runError: null,
      pythonFetchProgress: null,
    });

    // Python engine: mount the visual stage immediately (no blocking
    // loader), fetch trial 0, then stream the remaining trials in the
    // background while trial 0 plays back through the same step()/advance()
    // animation loop as the TypeScript engine.
    if (state.engine === "python" && isTauri()) {
      const { instanceName, params, trialCount } = state;
      set({ status: "running", preparing: false, pythonFetchProgress: { done: 0, total: trialCount } });
      (async () => {
        try {
          for (let t = 0; t < trialCount; t++) {
            if (get().pythonRunId !== runId) return;
            const results = await runPythonTrial(instanceName, params.seed + t, params, true);
            if (get().pythonRunId !== runId) return;
            const completed = buildPythonTrial(t, params.seed + t, results);
            const nextRaw = [...get().pythonRaw];
            nextRaw[t] = results;
            const nextTrials = [...get().trials, completed];
            const fetchProgress = { done: t + 1, total: trialCount };
            if (t === 0) {
              set({
                trials: nextTrials,
                pythonRaw: nextRaw,
                engines: buildPlaybackEngines(instanceName, params, completed, results) as unknown as AlgoEngine[],
                preparing: false,
                status: "running",
                currentTrial: 0,
                frame: 0,
                pythonFetchProgress: fetchProgress,
              });
            } else {
              set({ trials: nextTrials, pythonRaw: nextRaw, pythonFetchProgress: fetchProgress });
            }
            // If all trials are now fetched, complete the run. For the
            // case where trial-0 playback already finished, this is the
            // signal to move from background-fetch to completed.
            if (nextTrials.length >= trialCount) {
              const st = get();
              const playbackDone = st.engines.length > 0 && st.engines.every((e) => e.done);
              if (playbackDone) {
                set({ status: "completed", preparing: false, pythonFetchProgress: null });
                return;
              }
            }
            await new Promise((r) => setTimeout(r, 0));
          }
          // All trials fetched but playback may still be running — let
          // advance() handle the final transition to completed.
        } catch (err) {
          if (get().pythonRunId !== runId) return;
          console.error("Python engine error:", err);
          set({
            status: "running",
            preparing: false,
            pythonFetchProgress: null,
            runError:
              err instanceof Error
                ? `Python engine failed: ${err.message}`
                : `Python engine failed: ${String(err)}`,
          });
        }
      })();
      return;
    }

    // TypeScript engine: step through iterations in the animation loop
    prepareTimer = setTimeout(() => {
      const { instanceName, params } = get();
      set({
        status: "running",
        preparing: false,
        engines: makeEngines(instanceName, params, 0),
      });
    }, 60);
  },

  pause: () => {
    if (get().status === "running") set({ status: "paused" });
  },

  resume: () => {
    if (get().status === "paused") set({ status: "running" });
  },

  stop: () => {
    clearPrepareTimer();
    set((s) => ({
      status: "config",
      preparing: false,
      engines: [],
      currentTrial: 0,
      frame: 0,
      edgeCache: emptyEdgeMap(),
      flashCount: { 0: 0, 1: 0, 2: 0 },
      trials: [],
      pythonRaw: [],
      pythonRunId: s.pythonRunId + 1,
      runError: null,
      pythonFetchProgress: null,
    }));
  },

  advance: () => {
    const state = get();
    if (state.preparing || state.status !== "running" || state.engines.length === 0) return;

    const { engines } = state;
    const isPlayback =
      engines.length > 0 && engines.every((e) => e instanceof PythonPlaybackEngine);

    // Fast path: engines already done (e.g. waiting for background fetch).
    // For Python playback cycle through every fetched trial sequentially
    // so the user actually sees all trials, not just trial 0.
    if (engines.every((e) => e.done)) {
      if (isPlayback) {
        const fetched = get().trials.length;
        const total = get().trialCount;
        // Last trial finished?
        if (state.currentTrial + 1 >= total) {
          // Only complete once all fetches are in — otherwise keep polling
          // without churn.
          if (fetched >= total) set({ status: "completed", pythonFetchProgress: null });
          return;
        }
        // Try to advance to the next fetched trial.
        const nextIdx = state.currentTrial + 1;
        const nextRaw = get().pythonRaw[nextIdx];
        const nextTrial = get().trials[nextIdx];
        if (nextRaw && nextTrial) {
          const nextEngines = buildPlaybackEngines(
            state.instanceName, state.params, nextTrial, nextRaw
          ) as unknown as AlgoEngine[];
          set({
            engines: nextEngines,
            currentTrial: nextIdx,
            frame: 0,
            edgeCache: emptyEdgeMap(),
            flashCount: { 0: 0, 1: 0, 2: 0 },
          });
        }
        // If next trial not yet fetched, just wait (no set churn).
        return;
      }
      const completed: CompletedTrial = {
        trial: state.currentTrial,
        seed: state.params.seed + state.currentTrial,
        perAlgo: engines.map((e) => ({
          algo: e.algo,
          bestDist: e.best[e.best.length - 1],
          convergenceIter: e.convergenceIteration(),
          activations: e.activations,
          runtimeS: e.runtimeS,
        })),
        series: engines.map((e) => ({
          algo: e.algo,
          best: [...e.best],
          entropy: [...e.entropy],
          dominance: [...e.dominance],
          triggered: [...e.triggered],
        })),
      };

      const nextTrial = state.currentTrial + 1;
      const allTrialsDone = nextTrial >= get().trialCount;

      if (allTrialsDone) {
        set({
          trials: [...state.trials, completed],
          status: "completed",
        });
      } else {
        set({
          trials: [...state.trials, completed],
          status: "paused",
          preparing: true,
          currentTrial: nextTrial,
        });
        prepareTimer = setTimeout(() => {
          set({
            engines: makeEngines(get().instanceName, get().params, get().currentTrial),
            status: "running",
            preparing: false,
          });
        }, 40);
      }
      return;
    }

    const { playbackSpeed } = state;
    const edges = { ...state.edgeCache };
    const flashes = { ...state.flashCount };
    let lastFrame = state.frame;

    for (let s = 0; s < playbackSpeed; s++) {
      let stepped = false;
      for (const engine of engines) {
        const snap = engine.step();
        if (!snap) continue;
        stepped = true;
        if (snap.triggerFired) flashes[engine.algo]++;
        lastFrame = snap.frame;
      }
      if (!stepped) break;
    }

    for (const engine of engines) {
      edges[engine.algo] = engine.strongEdges();
    }

    // After stepping, if every engine just finished, finalize the trial
    // instead of just updating the frame. Saves one extra tick vs. waiting
    // for the fast-path above on the next frame.
    if (engines.every((e) => e.done)) {
      if (isPlayback) {
        const total = get().trialCount;
        const fetched = get().trials.length;
        const nextIdx = state.currentTrial + 1;
        const isLast = nextIdx >= total;
        // Always show the last frame's trails for this trial.
        if (isLast) {
          if (fetched >= total) {
            set({ edgeCache: edges, flashCount: flashes, frame: lastFrame, status: "completed", pythonFetchProgress: null });
          } else {
            set({ edgeCache: edges, flashCount: flashes, frame: lastFrame });
          }
          return;
        }
        // Not the last trial: try to roll to the next one immediately so
        // the user actually sees every trial in sequence.
        const nextRaw = get().pythonRaw[nextIdx];
        const nextTrial = get().trials[nextIdx];
        if (nextRaw && nextTrial) {
          const nextEngines = buildPlaybackEngines(
            state.instanceName, state.params, nextTrial, nextRaw
          ) as unknown as AlgoEngine[];
          set({
            engines: nextEngines,
            currentTrial: nextIdx,
            frame: 0,
            edgeCache: emptyEdgeMap(),
            flashCount: { 0: 0, 1: 0, 2: 0 },
          });
        } else {
          // Next trial not yet fetched — keep scene live and poll.
          set({ edgeCache: edges, flashCount: flashes, frame: lastFrame });
        }
        return;
      }
      const completed: CompletedTrial = {
        trial: state.currentTrial,
        seed: state.params.seed + state.currentTrial,
        perAlgo: engines.map((e) => ({
          algo: e.algo,
          bestDist: e.best[e.best.length - 1],
          convergenceIter: e.convergenceIteration(),
          activations: e.activations,
          runtimeS: e.runtimeS,
        })),
        series: engines.map((e) => ({
          algo: e.algo,
          best: [...e.best],
          entropy: [...e.entropy],
          dominance: [...e.dominance],
          triggered: [...e.triggered],
        })),
      };

      const nextTrial = state.currentTrial + 1;
      const allTrialsDone = nextTrial >= get().trialCount;

      if (allTrialsDone) {
        set({
          edgeCache: edges,
          flashCount: flashes,
          frame: lastFrame,
          trials: [...state.trials, completed],
          status: "completed",
        });
      } else {
        set({
          edgeCache: edges,
          flashCount: flashes,
          frame: lastFrame,
          trials: [...state.trials, completed],
          status: "paused",
          preparing: true,
          currentTrial: nextTrial,
        });
        prepareTimer = setTimeout(() => {
          set({
            engines: makeEngines(get().instanceName, get().params, get().currentTrial),
            status: "running",
            preparing: false,
          });
        }, 40);
      }
      return;
    }

    // Normal frame — engines still stepping.
    set({ edgeCache: edges, flashCount: flashes, frame: lastFrame });
  },
}));

/** Aggregate mean metrics per algorithm over completed trials. */
export interface AlgoAggregate {
  algo: AlgoId;
  key: string;
  name: string;
  meanBest: number;
  meanGapPct: number;
  meanConvergence: number;
  meanActivations: number;
  meanRuntimeS: number;
}

export function aggregateTrials(instanceName: InstanceName, trials: CompletedTrial[]): AlgoAggregate[] {
  const instance = INSTANCES[instanceName];
  return ALGORITHM_IDS.map((algo) => {
    const rows = trials.flatMap((t) => t.perAlgo.filter((r) => r.algo === algo));
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
    const meanBest = mean(rows.map((r) => r.bestDist));
    return {
      algo,
      key: ALGO_KEYS[algo],
      name: ALGO_NAMES[algo],
      meanBest,
      meanGapPct: ((meanBest - instance.optimum) / instance.optimum) * 100,
      meanConvergence: mean(rows.map((r) => r.convergenceIter)),
      meanActivations: mean(rows.map((r) => r.activations)),
      meanRuntimeS: mean(rows.map((r) => r.runtimeS)),
    };
  });
}
