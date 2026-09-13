/**
 * Deterministic 32-bit PRNG (mulberry32).
 *
 * The thesis Python code uses numpy's PCG64; exact numeric parity across
 * languages is neither achievable nor required. What the methodology requires
 * is reproducibility: identical seeds must yield identical runs, and every
 * algorithm condition must consume its own independent stream. mulberry32
 * satisfies both, passes gjrand/burtlebrank smoke batteries, and is fast.
 */

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform integer in [0, n). Mirrors numpy Generator.integers(n). */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}
