/**
 * Stochastic tour construction (aco.construct_tours, AS transition rule).
 *
 * Each ant starts from a uniformly random city and repeatedly chooses the
 * next city by roulette wheel over
 *
 *     p(i, j) ∝ tau(i, j)^alpha * eta(i, j)^beta,   eta = 1 / d
 *
 * restricted to unvisited cities.
 */
import type { DistanceMatrix } from "./distance";
import type { Rng } from "./rng";

/**
 * Precomputed heuristic visibility raised to beta: eta^beta = d^-beta.
 * Constant for a given instance, so the engine builds this once instead of
 * re-evaluating n^2 pow() calls on every iteration.
 */
export function computeEtaBeta(d: DistanceMatrix, n: number, beta: number): Float64Array {
  const etaBeta = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dist = d[i * n + j];
      etaBeta[i * n + j] = dist > 0 ? Math.pow(1 / dist, beta) : 0;
    }
  }
  return etaBeta;
}

/**
 * Effective desirability a(i,j) = tau^alpha * eta^beta.
 *
 * The alpha = 1 case (the thesis default) is a pure multiply: no pow().
 */
export function effectiveDesirability(
  tau: Float64Array,
  etaBeta: Float64Array,
  alpha: number,
  out?: Float64Array
): Float64Array {
  const eff = out ?? new Float64Array(tau.length);
  if (alpha === 1) {
    for (let i = 0; i < tau.length; i++) eff[i] = tau[i] * etaBeta[i];
  } else if (alpha === 0) {
    for (let i = 0; i < tau.length; i++) eff[i] = etaBeta[i];
  } else {
    for (let i = 0; i < tau.length; i++) eff[i] = Math.pow(tau[i], alpha) * etaBeta[i];
  }
  return eff;
}

/**
 * Construct m tours; returns m tours of stride n laid end-to-end.
 * `starts` receives the chosen start city of every ant (useful for visuals).
 */
export function constructTours(
  eff: Float64Array,
  n: number,
  m: number,
  rng: Rng,
  starts?: Int32Array
): Int32Array {
  const tours = new Int32Array(m * n);
  const allowed = new Int32Array(n);
  const weights = new Float64Array(n);

  for (let k = 0; k < m; k++) {
    const start = Math.floor(rng() * n);
    if (starts) starts[k] = start;
    const base = k * n;
    tours[base] = start;

    let count = 0;
    for (let i = 0; i < n; i++) {
      if (i !== start) allowed[count++] = i;
    }

    for (let step = 1; step < n; step++) {
      const cur = tours[base + step - 1];
      const row = cur * n;

      // roulette wheel over allowed cities
      let sum = 0;
      for (let a = 0; a < count; a++) {
        const w = eff[row + allowed[a]];
        weights[a] = w;
        sum += w;
      }

      let pick = count - 1;
      if (sum > 0) {
        const x = rng() * sum;
        let acc = 0;
        for (let a = 0; a < count; a++) {
          acc += weights[a];
          if (x < acc) {
            pick = a;
            break;
          }
        }
      }

      const next = allowed[pick];
      tours[base + step] = next;
      // compact the allowed list in place
      for (let a = pick; a < count - 1; a++) allowed[a] = allowed[a + 1];
      count--;
    }
  }
  return tours;
}
