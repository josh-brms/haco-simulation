/**
 * Tour utilities (tsplib.nearest_neighbor_tour, aco.tour_lengths,
 * two_opt.tour_dist).
 */
import type { DistanceMatrix } from "./distance";
import { randInt, type Rng } from "./rng";

/** Total Euclidean tour length including the closing edge. */
export function tourDistance(d: DistanceMatrix, n: number, tour: Int32Array): number {
  let len = 0;
  for (let k = 0; k < n - 1; k++) len += d[tour[k] * n + tour[k + 1]];
  return len + d[tour[n - 1] * n + tour[0]];
}

/** Lengths of m tours laid out end-to-end in `tours` (stride n). */
export function tourDistances(
  d: DistanceMatrix,
  n: number,
  tours: Int32Array,
  m: number
): Float64Array {
  const lens = new Float64Array(m);
  for (let k = 0; k < m; k++) {
    lens[k] = tourDistance(d, n, tours.subarray(k * n, k * n + n));
  }
  return lens;
}

/**
 * Nearest-neighbour tour from a uniformly random start city.
 * Used as the greedy seed of the proposed adaptive HACO.
 */
export function nearestNeighborTour(
  d: DistanceMatrix,
  n: number,
  rng: Rng
): { tour: Int32Array; length: number } {
  const start = randInt(rng, n);
  const tour = new Int32Array(n);
  const visited = new Uint8Array(n);
  tour[0] = start;
  visited[start] = 1;

  for (let k = 1; k < n; k++) {
    const prev = tour[k - 1];
    let best = -1;
    let bestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited[j] && d[prev * n + j] < bestDist) {
        bestDist = d[prev * n + j];
        best = j;
      }
    }
    tour[k] = best;
    visited[best] = 1;
  }

  return { tour, length: tourDistance(d, n, tour) };
}
