/**
 * Benchmark engine — the three algorithm conditions under comparison
 * (algorithms.py):
 *
 *   0. Standard ACO        no local search
 *   1. Non-adaptive HACO   2-opt applied to the best tour at every iteration
 *   2. Proposed Adaptive   2-opt only when H(S) < theta AND PDR > tau_PDR
 *      HACO                (with greedy-seeded initialization)
 *
 * AlgoEngine runs ONE algorithm condition and advances one iteration per
 * step() so the UI can render the search in real time.
 */
import type { TspInstance } from "./instances";
import { distanceMatrix, type DistanceMatrix } from "./distance";
import { nearestNeighborTour, tourDistance, tourDistances } from "./tour";
import { initialTau, updatePheromones, type PheromoneParams } from "./pheromone";
import {
  computeEtaBeta,
  constructTours,
  effectiveDesirability,
} from "./construct";
import { shannonEntropy } from "./signals";
import { twoOpt } from "./local-search";
import { createRng } from "./rng";

// ---------------------------------------------------------------------------
// Shared benchmark parameters (params.json)
// ---------------------------------------------------------------------------

export interface BenchmarkParams extends PheromoneParams {
  /** Pheromone exponent in the AS transition rule. */
  alpha: number;
  /** Heuristic visibility exponent in the AS transition rule. */
  beta: number;
  /** Number of ants per iteration (m). */
  ants: number;
  /** Maximum iterations (T_max). */
  tMax: number;
  /** Base seed; trial i uses seed + i for the paired statistical design. */
  seed: number;
}

export const DEFAULT_PARAMS: BenchmarkParams = {
  alpha: 1.0,
  beta: 5.0,
  rho: 0.5,
  Q: 1.0,
  greedyBoost: 10.0,
  ants: 30,
  tMax: 500,
  seed: 0,
};

// Convergence criterion (thesis SOP 2): relative improvement <= eps over a
// sliding window of W iterations.
export const CONVERGENCE_WINDOW = 20;
export const CONVERGENCE_EPSILON = 0.001;

// ---------------------------------------------------------------------------
// Algorithm registry
// ---------------------------------------------------------------------------

export type AlgoId = 0 | 1 | 2;

export const ALGORITHM_IDS: AlgoId[] = [0, 1, 2];

export const ALGO_NAMES: Record<AlgoId, string> = {
  0: "Standard ACO",
  1: "Non-adaptive HACO",
  2: "Proposed Adaptive HACO",
};

export const ALGO_KEYS: Record<AlgoId, string> = {
  0: "standard_aco",
  1: "nonadaptive_haco",
  2: "adaptive_haco",
};

export const ALGO_COLORS: Record<AlgoId, string> = {
  0: "#71717a",
  1: "#f97316",
  2: "#ef4444",
};

// ---------------------------------------------------------------------------
// Iteration snapshot (consumed by the 3D view and charts)
// ---------------------------------------------------------------------------

export interface FrameSnapshot {
  frame: number;
  bestLen: number;
  entropy: number;
  pdr: number;
  triggerFired: boolean;
  bestTour: Int32Array;
  tau: Float64Array;
}

/** Strongest symmetric pheromone edges, as returned by AlgoEngine.strongEdges. */
export interface EdgeWeights {
  i: Int32Array;
  j: Int32Array;
  w: Float32Array;
  count: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class AlgoEngine {
  readonly algo: AlgoId;
  readonly instance: TspInstance;
  readonly params: BenchmarkParams;

  readonly n: number;
  readonly d: DistanceMatrix;
  readonly theta: number;
  readonly tauPdr: number;
  readonly optimum: number;

  /** Best-so-far length per iteration, index = frame. */
  readonly best: number[] = [];
  /** Shannon entropy H(S) of the population per iteration. */
  readonly entropy: number[] = [];
  /** Pheromone Dominance Ratio per iteration. */
  readonly dominance: number[] = [];
  /** Whether the adaptive trigger fired at each iteration. */
  readonly triggered: boolean[] = [];
  /** Total adaptive 2-opt activations. */
  activations = 0;
  /** Wall-clock seconds spent inside step(). */
  runtimeS = 0;

  /** n entries per frame: the best tour at the end of that iteration. */
  readonly bestTourAt: Int32Array;

  private rng = createRng(0);
  private tau: Float64Array;
  /** Precomputed d^-beta (constant per instance). */
  private etaBeta: Float64Array;
  /** Reused desirability scratch, avoids an n^2 allocation per iteration. */
  private effScratch: Float64Array;
  private bestTour: Int32Array;
  private bestLen: number;
  private frame = 0;
  private antStarts: Int32Array;

  constructor(algo: AlgoId, instance: TspInstance, params: BenchmarkParams, seed: number) {
    this.algo = algo;
    this.instance = instance;
    this.params = params;

    this.n = instance.nodes;
    this.d = distanceMatrix(instance.coords);
    this.theta = instance.entropyTheta;
    this.tauPdr = instance.pdrThreshold;
    this.optimum = instance.optimum;

    this.bestTourAt = new Int32Array(params.tMax * this.n).fill(-1);
    this.antStarts = new Int32Array(params.ants);

    this.etaBeta = computeEtaBeta(this.d, this.n, params.beta);
    this.effScratch = new Float64Array(this.n * this.n);

    this.rng = createRng((Math.imul(seed, 0x9e3779b1) ^ Math.imul(algo + 1, 0x85ebca6b)) >>> 0);

    if (algo === 2) {
      // Greedy-seeded initialization (proposed adaptive HACO only).
      const { tour } = nearestNeighborTour(this.d, this.n, this.rng);
      this.tau = initialTau(this.d, this.n, params, tour, this.rng);
      this.bestTour = Int32Array.from(tour);
      this.bestLen = tourDistance(this.d, this.n, tour);
    } else {
      this.tau = initialTau(this.d, this.n, params);
      this.bestTour = new Int32Array(this.n);
      this.bestLen = Infinity;
    }
  }

  get currentFrame(): number {
    return this.frame;
  }

  /** Best tour length found so far (NaN-safe: Infinity before any improvement). */
  get currentBest(): number {
    return this.bestLen;
  }

  get done(): boolean {
    return this.frame >= this.params.tMax;
  }

  /** Run a single iteration; returns null once T_max is reached. */
  step(): FrameSnapshot | null {
    if (this.done) return null;
    const t0 = performance.now();

    const { n, params } = this;
    const m = params.ants;

    // 1. probabilistic tour construction (desirability reuses the scratch)
    const eff = effectiveDesirability(this.tau, this.etaBeta, params.alpha, this.effScratch);
    const tours = constructTours(eff, n, m, this.rng, this.antStarts);

    // 2. iteration best vs global best
    const lens = tourDistances(this.d, n, tours, m);
    let k = 0;
    for (let i = 1; i < m; i++) {
      if (lens[i] < lens[k]) k = i;
    }
    if (lens[k] < this.bestLen) {
      this.bestLen = lens[k];
      this.bestTour = Int32Array.from(tours.subarray(k * n, k * n + n));
    }

    // 3. pheromone update in place; dominance ratio comes from the same pass
    const updated = updatePheromones(this.tau, this.d, n, tours, m, lens, params, this.tau);
    this.tau = updated.tau;
    const P = updated.dominance;

    // 4. diversity signal
    const H = shannonEntropy(tours, n, m);

    // 5. local-search policy
    let fired = false;
    if (this.algo === 1) {
      this.bestTour = twoOpt(this.bestTour, this.d, n);
      this.bestLen = tourDistance(this.d, n, this.bestTour);
    } else if (this.algo === 2 && H < this.theta && P > this.tauPdr) {
      this.bestTour = twoOpt(this.bestTour, this.d, n);
      this.bestLen = tourDistance(this.d, n, this.bestTour);
      fired = true;
      this.activations++;
    }

    // 6. record
    const f = this.frame;
    this.best.push(this.bestLen);
    this.entropy.push(H);
    this.dominance.push(P);
    this.triggered.push(fired);
    this.bestTourAt.set(this.bestTour, f * n);
    this.frame++;

    this.runtimeS += (performance.now() - t0) / 1000;

    return {
      frame: f,
      bestLen: this.bestLen,
      entropy: H,
      pdr: P,
      triggerFired: fired,
      bestTour: this.bestTour,
      tau: this.tau,
    };
  }

  /** Iteration at which the convergence criterion is first met, else T_max. */
  convergenceIteration(): number {
    const h = this.best;
    for (let t = CONVERGENCE_WINDOW; t < h.length; t++) {
      const prev = h[t - CONVERGENCE_WINDOW];
      if (prev > 0 && (prev - h[t]) / prev <= CONVERGENCE_EPSILON) return t;
    }
    return h.length;
  }

  /** Strongest symmetric pheromone edges, capped for rendering. */
  strongEdges(cap = 400): EdgeWeights {
    const { n } = this;
    const idx = new Uint32Array(cap);
    const val = new Float64Array(cap).fill(-1);
    let filled = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const w = this.tau[i * n + j] + this.tau[j * n + i];
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

// ---------------------------------------------------------------------------
// Full-trial helper (used by tests and batch aggregation)
// ---------------------------------------------------------------------------

export interface TrialOutcome {
  algo: AlgoId;
  seed: number;
  bestDist: number;
  convergenceIter: number;
  activations: number;
  runtimeS: number;
  best: number[];
  entropy: number[];
  dominance: number[];
  triggered: boolean[];
}

/** Run one complete trial of one algorithm to T_max. */
export function runTrial(
  algo: AlgoId,
  instance: TspInstance,
  params: BenchmarkParams,
  seed: number
): TrialOutcome {
  const engine = new AlgoEngine(algo, instance, params, seed);
  while (!engine.done) engine.step();
  return {
    algo,
    seed,
    bestDist: engine.best[engine.best.length - 1],
    convergenceIter: engine.convergenceIteration(),
    activations: engine.activations,
    runtimeS: engine.runtimeS,
    best: [...engine.best],
    entropy: [...engine.entropy],
    dominance: [...engine.dominance],
    triggered: [...engine.triggered],
  };
}
