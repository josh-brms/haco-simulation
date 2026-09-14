import { create } from "zustand";
import {
  AlgoEngine,
  ALGO_NAMES,
  type AlgoId,
  type BenchmarkParams,
  type FrameSnapshot,
  DEFAULT_PARAMS,
} from "@/sim/engine";
import { INSTANCES, type InstanceName } from "@/sim/instances";

export type SimStatus = "config" | "playing" | "paused" | "done";

/** Execution phase, used for the run-structure pipeline and code highlight. */
export type SimPhase = "init" | "construct" | "update" | "signals" | "trigger" | "twoopt";

export const PHASE_LABELS: Record<SimPhase, string> = {
  init: "Initialization",
  construct: "Tour Construction",
  update: "Pheromone Update",
  signals: "Entropy / PDR Check",
  trigger: "Adaptive Trigger",
  twoopt: "2-opt Local Search",
};

export interface LogEntry {
  iter: number;
  text: string;
  level: "info" | "trigger";
}

interface SimState {
  instanceName: InstanceName;
  algo: AlgoId;
  params: BenchmarkParams;
  iterationsPerSecond: number;

  status: SimStatus;
  /** True while the engine is being constructed (loader overlay shows). */
  preparing: boolean;
  engine: AlgoEngine | null;
  frame: number;
  phase: SimPhase;
  logs: LogEntry[];
  flashCount: number;
  vars: {
    entropy: number;
    theta: number;
    dominance: number;
    tauPdr: number;
    bestLen: number;
    triggered: boolean;
  };

  setInstance: (name: InstanceName) => void;
  setAlgo: (algo: AlgoId) => void;
  setParam: <K extends keyof BenchmarkParams>(key: K, value: BenchmarkParams[K]) => void;
  setIterationsPerSecond: (rate: number) => void;
  prepare: () => void;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  scrubTo: (frame: number) => void;
  reset: () => void;
  /** Advance exactly one iteration. */
  advance: () => void;
}

let prepareTimer: ReturnType<typeof setTimeout> | undefined;
const clearPrepareTimer = () => {
  if (prepareTimer !== undefined) {
    clearTimeout(prepareTimer);
    prepareTimer = undefined;
  }
};

function phaseFor(engine: AlgoEngine, snap: FrameSnapshot): SimPhase {
  if (snap.triggerFired) return "trigger";
  if (engine.algo === 1) return "twoopt";
  if (engine.algo === 2 && (snap.entropy < engine.theta || snap.pdr > engine.tauPdr)) {
    return "signals";
  }
  return "construct";
}

export const useSimStore = create<SimState>((set, get) => ({
  instanceName: "eil51",
  algo: 2,
  params: { ...DEFAULT_PARAMS },
  iterationsPerSecond: 20,

  status: "config",
  preparing: false,
  engine: null,
  frame: 0,
  phase: "init",
  logs: [],
  flashCount: 0,
  vars: { entropy: 0, theta: 0, dominance: 1, tauPdr: 2, bestLen: Infinity, triggered: false },

  setInstance: (name) => {
    if (get().status === "playing") return;
    set({ instanceName: name });
  },

  setAlgo: (algo) => {
    if (get().status === "playing") return;
    set({ algo });
  },

  setParam: (key, value) => {
    if (get().status === "playing") return;
    set((s) => ({ params: { ...s.params, [key]: value } }));
  },

  setIterationsPerSecond: (rate) => set({ iterationsPerSecond: Math.max(1, Math.min(200, rate)) }),

  prepare: () => {
    if (get().preparing) return;
    clearPrepareTimer();
    set({
      status: "config",
      preparing: true,
      engine: null,
      frame: 0,
      phase: "init",
      flashCount: 0,
      logs: [],
      vars: { entropy: 0, theta: 0, dominance: 1, tauPdr: 2, bestLen: Infinity, triggered: false },
    });
    // yield a frame so the loader paints before the (blocking) engine build
    prepareTimer = setTimeout(() => {
      const { instanceName, algo, params } = get();
      const engine = new AlgoEngine(algo, INSTANCES[instanceName], params, params.seed);
      set({
        engine,
        preparing: false,
        status: get().status === "playing" ? "playing" : "paused",
        frame: 0,
        phase: "init",
        logs: [
          {
            iter: 0,
            text:
              algo === 2
                ? `Greedy-seeded initialization on ${instanceName}: NN tour L=${engine.currentBest.toFixed(1)}, pheromone boost x${params.greedyBoost}`
                : `Uniform pheromone init on ${instanceName} (n=${engine.n})`,
            level: "info",
          },
        ],
        vars: {
          entropy: 0,
          theta: engine.theta,
          dominance: 1,
          tauPdr: engine.tauPdr,
          bestLen: algo === 2 ? engine.currentBest : Infinity,
          triggered: false,
        },
      });
    }, 50);
  },

  play: () => {
    if (!get().engine && !get().preparing) get().prepare();
    set({ status: "playing" });
  },

  pause: () => {
    if (get().status === "playing") set({ status: "paused" });
  },

  stepOnce: () => {
    if (!get().engine && !get().preparing) get().prepare();
    get().advance();
    set({ status: "paused" });
  },

  advance: () => {
    const state = get();
    const engine = state.engine;
    if (state.preparing || !engine) return;
    if (engine.done) {
      set({ status: "done" });
      return;
    }

    const snap = engine.step();
    if (!snap) {
      set({ status: "done" });
      return;
    }

    const newLogs: LogEntry[] = [];
    if (snap.triggerFired) {
      newLogs.push({
        iter: snap.frame + 1,
        level: "trigger",
        text:
          `2-opt fired: H=${snap.entropy.toFixed(1)} < θ=${engine.theta.toFixed(1)} ` +
          `and PDR=${snap.pdr.toFixed(2)} > τ_PDR=${engine.tauPdr} ` +
          `(L* ${state.vars.bestLen.toFixed(1)} -> ${snap.bestLen.toFixed(1)})`,
      });
    } else if ((snap.frame + 1) % 50 === 0) {
      newLogs.push({
        iter: snap.frame + 1,
        level: "info",
        text: `t=${snap.frame + 1}: L*=${snap.bestLen.toFixed(1)} H=${snap.entropy.toFixed(1)} PDR=${snap.pdr.toFixed(2)}`,
      });
    }

    set({
      frame: engine.currentFrame,
      phase: phaseFor(engine, snap),
      status: engine.done ? "done" : state.status,
      flashCount: snap.triggerFired ? state.flashCount + 1 : state.flashCount,
      logs: newLogs.length > 0 ? [...newLogs, ...state.logs].slice(0, 200) : state.logs,
      vars: {
        entropy: snap.entropy,
        theta: engine.theta,
        dominance: snap.pdr,
        tauPdr: engine.tauPdr,
        bestLen: snap.bestLen,
        triggered: snap.triggerFired,
      },
    });
  },

  scrubTo: (target) => {
    const state = get();
    if (!state.engine && !state.preparing) state.prepare();
    const engine = get().engine;
    if (!engine) return;

    const targetFrame = Math.max(0, Math.min(engine.params.tMax, Math.floor(target)));
    if (targetFrame <= engine.currentFrame) return;

    clearPrepareTimer();
    set({ preparing: true });

    // advance in frame-budgeted chunks so the loader keeps animating
    const chunk = () => {
      const eng = get().engine;
      if (!eng) {
        set({ preparing: false });
        return;
      }
      const deadline = performance.now() + 24;
      let lastSnap: FrameSnapshot | null = null;
      let fired = false;
      while (eng.currentFrame < targetFrame && performance.now() < deadline) {
        lastSnap = eng.step();
        if (!lastSnap) break;
        if (lastSnap.triggerFired) fired = true;
      }

      if (lastSnap) {
        set({
          frame: eng.currentFrame,
          phase: phaseFor(eng, lastSnap),
          flashCount: fired ? get().flashCount + 1 : get().flashCount,
          vars: {
            entropy: lastSnap.entropy,
            theta: eng.theta,
            dominance: lastSnap.pdr,
            tauPdr: eng.tauPdr,
            bestLen: lastSnap.bestLen,
            triggered: fired,
          },
        });
      }

      if (eng.currentFrame < targetFrame && !eng.done) {
        prepareTimer = setTimeout(chunk, 0);
      } else {
        set({ preparing: false, status: eng.done ? "done" : get().status });
      }
    };
    chunk();
  },

  reset: () => {
    clearPrepareTimer();
    set({
      status: "config",
      preparing: false,
      engine: null,
      frame: 0,
      phase: "init",
      logs: [],
      flashCount: 0,
      vars: { entropy: 0, theta: 0, dominance: 1, tauPdr: 2, bestLen: Infinity, triggered: false },
    });
  },
}));

export { ALGO_NAMES };
