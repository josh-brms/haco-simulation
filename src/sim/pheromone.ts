/**
 * Pheromone model (aco.initial_tau, aco.update_pheromones).
 *
 * tau0 = 1 / (n * L_nn) with a zero diagonal. When greedy seeding is enabled
 * the seed tour's edges receive tau0 * greedyBoost, matching the proposed
 * adaptive HACO's "greedy-seeded initialization".
 *
 * The per-iteration update runs in place on caller-provided buffers
 * (ping-pong style) so no n^2 allocation happens per step, and returns the
 * Pheromone Dominance Ratio from the same read pass pdr() would need.
 */
import type { DistanceMatrix } from "./distance";
import { tourDistance, nearestNeighborTour } from "./tour";
import { createRng, type Rng } from "./rng";

export interface PheromoneParams {
  rho: number;
  Q: number;
  greedyBoost: number;
}

export function initialTau(
  d: DistanceMatrix,
  n: number,
  params: PheromoneParams,
  seedTour: Int32Array | null = null,
  /** Deterministic by default, matching Python's default_rng(0) baseline. */
  baselineRng: Rng = createRng(0)
): Float64Array {
  const { tour: nnTour } = nearestNeighborTour(d, n, baselineRng);
  const lnn = tourDistance(d, n, nnTour);
  const tau0 = 1 / (n * lnn);

  const tau = new Float64Array(n * n).fill(tau0);
  for (let i = 0; i < n; i++) tau[i * n + i] = 0;

  if (seedTour) {
    for (let s = 0; s < n; s++) {
      const i = seedTour[s];
      const j = seedTour[(s + 1) % n];
      const boosted = tau[i * n + j] * params.greedyBoost;
      tau[i * n + j] = boosted;
      tau[j * n + i] = boosted;
    }
  }
  return tau;
}

/**
 * Evaporation + AS reinforcement written into `out`:
 *
 *     out <- (1 - rho) * tau + sum_k Q / L_k
 *
 * Returns { tau: out, dominance } where dominance is PDR(t) computed over
 * the updated matrix (max / mean over active entries) in the same read pass.
 * `out` may alias `tau` (in-place evaporation) as long as they are the same
 * buffer instance the caller ping-pongs between iterations.
 */
export function updatePheromones(
  tau: Float64Array,
  d: DistanceMatrix,
  n: number,
  tours: Int32Array,
  m: number,
  lens: Float64Array,
  params: PheromoneParams,
  out: Float64Array
): { tau: Float64Array; dominance: number } {
  const evap = 1 - params.rho;
  let max = 0;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < tau.length; i++) {
    const v = evap * tau[i];
    out[i] = v;
    if (v > 0) {
      if (v > max) max = v;
      sum += v;
      count++;
    }
  }

  // Deposits only add, and every non-diagonal cell stays active throughout,
  // so the final mean = (evaporated sum + total deposit) / count.
  let depositSum = 0;
  for (let k = 0; k < m; k++) {
    const deposit = params.Q / lens[k];
    depositSum += deposit * n;
    const base = k * n;
    for (let s = 0; s < n; s++) {
      const i = tours[base + s];
      const j = tours[base + ((s + 1) % n)];
      const v = (out[i * n + j] += deposit);
      if (v > max) max = v;
    }
  }

  return { tau: out, dominance: count === 0 ? 1 : max / ((sum + depositSum) / count) };
}
