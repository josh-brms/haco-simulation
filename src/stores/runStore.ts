import { create } from "zustand";
import {
  AlgoEngine,
  ALGORITHM_IDS,
  ALGO_KEYS,
  ALGO_NAMES,
  type AlgoId,
  type BenchmarkParams,
  type EdgeWeights,
  DEFAULT_PARAMS,
} from "@/sim/engine";
import { INSTANCES, type InstanceName } from "@/sim/instances";
import { runPythonTrial, isTauri, type PythonTrialResult } from "@/lib/native";

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

/** Convert Python trial results into the CompletedTrial format used by the store. */
function buildPythonTrial(trialIndex: number, seed: number, results: PythonTrialResult[]): CompletedTrial {
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
      dominance: r.pdr_at_trigger,
      triggered: r.entropy_at_trigger.map(() => false),
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
    set({
      status: "config",
      preparing: true,
      engines: [],
      currentTrial: 0,
      frame: 0,
      edgeCache: emptyEdgeMap(),
      flashCount: { 0: 0, 1: 0, 2: 0 },
      trials: [],
    });

    // Python engine: batch all trials via Tauri IPC (safety: fall back to TS if not in Tauri)
    if (state.engine === "python" && isTauri()) {
      const { instanceName, params, trialCount } = state;
      (async () => {
        try {
          const allTrials: CompletedTrial[] = [];
          for (let t = 0; t < trialCount; t++) {
            const results = await runPythonTrial(instanceName, params.seed + t, params);
            allTrials.push(buildPythonTrial(t, params.seed + t, results));
            // yield between trials so the UI stays responsive
            await new Promise((r) => setTimeout(r, 0));
          }
          set({
            status: "completed",
            preparing: false,
            trials: allTrials,
            engines: [],
            currentTrial: trialCount,
            frame: params.tMax,
          });
        } catch (err) {
          console.error("Python engine error:", err);
          set({ status: "config", preparing: false });
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
    set({
      status: "config",
      preparing: false,
      engines: [],
      currentTrial: 0,
      frame: 0,
      edgeCache: emptyEdgeMap(),
      flashCount: { 0: 0, 1: 0, 2: 0 },
      trials: [],
    });
  },

  advance: () => {
    const state = get();
    if (state.preparing || state.status !== "running" || state.engines.length === 0) return;

    const { engines, playbackSpeed, currentTrial, trials } = state;
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

    // render the trails once per tick from the latest pheromone state
    for (const engine of engines) {
      edges[engine.algo] = engine.strongEdges();
    }

    if (engines.every((e) => e.done)) {
      const completed: CompletedTrial = {
        trial: currentTrial,
        seed: state.params.seed + currentTrial,
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

      const nextTrial = currentTrial + 1;
      const allTrialsDone = nextTrial >= get().trialCount;

      if (allTrialsDone) {
        set({
          edgeCache: edges,
          flashCount: flashes,
          frame: lastFrame,
          trials: [...trials, completed],
          status: "completed",
        });
      } else {
        // brief loader between trials while the next engine set is built
        set({
          edgeCache: edges,
          flashCount: flashes,
          frame: lastFrame,
          trials: [...trials, completed],
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
    } else {
      set({ edgeCache: edges, flashCount: flashes, frame: lastFrame });
    }
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
