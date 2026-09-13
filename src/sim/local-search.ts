/**
 * 2-opt local search (two_opt.py, best-improvement variant with identical
 * tie-breaking).
 *
 * Repeatedly locates the single best improving move — remove edges
 * (a, b) and (c, c_next), reconnect crosswise — then reverses the enclosed
 * segment, until no move improves the tour.
 */
import type { DistanceMatrix } from "./distance";
import { tourDistance } from "./tour";

export function twoOpt(
  tour: Int32Array,
  d: DistanceMatrix,
  n: number,
  maxPasses = 500
): Int32Array {
  const t = Int32Array.from(tour);

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (let i = 0; i < n - 2; i++) {
      const a = t[i];
      const b = t[i + 1];

      let bestGain = 0;
      let bestJ = -1;
      for (let j = i + 2; j < n; j++) {
        const c = t[j];
        const cNext = t[(j + 1) % n];
        const gain = d[a * n + b] + d[c * n + cNext] - d[a * n + c] - d[b * n + cNext];
        if (gain > bestGain) {
          bestGain = gain;
          bestJ = j;
        }
      }

      if (bestJ >= 0 && bestGain > 1e-12) {
        for (let lo = i + 1, hi = bestJ; lo < hi; lo++, hi--) {
          const tmp = t[lo];
          t[lo] = t[hi];
          t[hi] = tmp;
        }
        improved = true;
        break;
      }
    }

    if (!improved) break;
  }
  return t;
}

export { tourDistance };
