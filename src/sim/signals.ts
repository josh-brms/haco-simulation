/**
 * Diversity and dominance signals (entropy_pdr.py).
 */

/**
 * Scratch buffers reused across calls (single-threaded engine), so computing
 * H(S) never allocates an n^2 array nor scans all n^2 cells per iteration:
 * counts accumulate over the m*n tour edges only, and the final sum runs
 * over the touched edges alone.
 */
let scratchCounts = new Float64Array(0);
let scratchTouched = new Int32Array(0);

/**
 * Shannon information entropy of the ant population's edge distribution:
 *
 *     H(S) = -sum_e p(e) log2 p(e),   p(e) = (ants using directed edge e) / m
 *
 * High H(S) means diverse exploration; low H(S) signals stagnation.
 */
export function shannonEntropy(tours: Int32Array, n: number, m: number): number {
  const cells = n * n;
  if (scratchCounts.length < cells) {
    scratchCounts = new Float64Array(cells);
  }

  const counts = scratchCounts;
  let touchedCount = 0;
  const minTouched = m * n;
  if (scratchTouched.length < minTouched) {
    scratchTouched = new Int32Array(minTouched);
  }
  const touched = scratchTouched;

  for (let k = 0; k < m; k++) {
    const base = k * n;
    for (let s = 0; s < n - 1; s++) {
      const e = tours[base + s] * n + tours[base + s + 1];
      if (counts[e] === 0) touched[touchedCount++] = e;
      counts[e]++;
    }
    const e = tours[base + n - 1] * n + tours[base];
    if (counts[e] === 0) touched[touchedCount++] = e;
    counts[e]++;
  }

  let h = 0;
  for (let t = 0; t < touchedCount; t++) {
    const e = touched[t];
    const p = counts[e] / m;
    h -= p * Math.log2(p);
    counts[e] = 0; // reset scratch for the next call
  }
  return h;
}

/**
 * Pheromone Dominance Ratio: PDR(t) = tau_max / mean(tau over active edges).
 * Near 1 the colony spreads pheromone evenly; much greater than 1 means a few
 * dominant edges are over-exploited.
 */
export function pdr(tau: Float64Array): number {
  let max = 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < tau.length; i++) {
    const v = tau[i];
    if (v > 0) {
      if (v > max) max = v;
      sum += v;
      count++;
    }
  }
  if (count === 0) return 1;
  return max / (sum / count);
}
