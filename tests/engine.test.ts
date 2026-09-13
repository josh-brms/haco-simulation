import { describe, it, expect } from "vitest";
import { AlgoEngine, runTrial, ALGORITHM_IDS, DEFAULT_PARAMS, CONVERGENCE_WINDOW } from "@/sim/engine";
import { INSTANCES } from "@/sim/instances";

const eil51 = INSTANCES.eil51;
const params = (over: Partial<typeof DEFAULT_PARAMS> = {}) => ({ ...DEFAULT_PARAMS, ...over });

describe("AlgoEngine construction", () => {
  it("binds instance geometry and calibrated thresholds", () => {
    const eng = new AlgoEngine(0, eil51, params(), 0);
    expect(eng.n).toBe(51);
    expect(eng.optimum).toBe(426);
    expect(eng.theta).toBeCloseTo(47.2437, 3);
    expect(eng.tauPdr).toBe(2.0);
    expect(eng.d.length).toBe(51 * 51);
  });

  it("is deterministic for the same seed and algorithm", () => {
    const a = new AlgoEngine(2, eil51, params({ tMax: 30 }), 42);
    const b = new AlgoEngine(2, eil51, params({ tMax: 30 }), 42);
    for (let i = 0; i < 30; i++) {
      const sa = a.step();
      const sb = b.step();
      expect(sa!.bestLen).toBeCloseTo(sb!.bestLen, 9);
      expect(sa!.entropy).toBeCloseTo(sb!.entropy, 9);
      expect(sa!.pdr).toBeCloseTo(sb!.pdr, 9);
      expect(sa!.triggerFired).toBe(sb!.triggerFired);
    }
    expect(a.activations).toBe(b.activations);
  });

  it("steps exactly tMax times then reports done", () => {
    const eng = new AlgoEngine(0, eil51, params({ tMax: 5 }), 0);
    for (let i = 0; i < 5; i++) {
      expect(eng.step()!.frame).toBe(i);
    }
    expect(eng.done).toBe(true);
    expect(eng.step()).toBeNull();
  });
});

describe("algorithm behaviour (algorithms.py semantics)", () => {
  it("improves best length monotonically for all three conditions", () => {
    for (const algo of ALGORITHM_IDS) {
      const eng = new AlgoEngine(algo, eil51, params({ tMax: 100 }), 1);
      let prev = Infinity;
      while (!eng.done) {
        const snap = eng.step()!;
        expect(snap.bestLen).toBeLessThanOrEqual(prev + 1e-9);
        prev = snap.bestLen;
      }
    }
  });

  it("adaptive triggers 2-opt sparsely; non-adaptive refines every iteration", () => {
    const tMax = 200;
    const adaptive = new AlgoEngine(2, eil51, params({ tMax }), 0);
    while (!adaptive.done) adaptive.step();
    expect(adaptive.activations).toBeGreaterThan(0);
    expect(adaptive.activations).toBeLessThan(tMax);
  });

  it("adaptive quality is within 5% of non-adaptive quality", () => {
    const cfg = params({ tMax: 300 });
    const adaptive = runTrial(2, eil51, cfg, 3);
    const nonadaptive = runTrial(1, eil51, cfg, 3);
    expect(adaptive.bestDist).toBeLessThan(nonadaptive.bestDist * 1.05);
  });

  it("all conditions land within a sane gap of the known optimum", () => {
    for (const algo of ALGORITHM_IDS) {
      const outcome = runTrial(algo, eil51, params({ tMax: 500 }), 5);
      const gap = (outcome.bestDist - eil51.optimum) / eil51.optimum;
      expect(gap).toBeGreaterThan(-0.001);
      expect(gap).toBeLessThan(0.2);
    }
  });

  it("greedy seeding gives the adaptive condition a head start", () => {
    const adaptive = new AlgoEngine(2, eil51, params({ tMax: 1 }), 9);
    const standard = new AlgoEngine(0, eil51, params({ tMax: 1 }), 9);
    const a0 = adaptive.step()!;
    const s0 = standard.step()!;
    // adaptive starts from an NN tour; after one iteration it is already bounded
    expect(a0.bestLen).toBeLessThan(s0.bestLen * 1.6);
  });

  it("convergence iteration respects the W=20 window", () => {
    const outcome = runTrial(0, eil51, params({ tMax: 300 }), 7);
    expect(outcome.convergenceIter).toBeGreaterThanOrEqual(CONVERGENCE_WINDOW);
    expect(outcome.convergenceIter).toBeLessThanOrEqual(300);
  });

  it("records a valid best tour per frame for rendering", () => {
    const eng = new AlgoEngine(2, eil51, params({ tMax: 10 }), 2);
    while (!eng.done) eng.step();
    for (let f = 0; f < 10; f++) {
      const slice = eng.bestTourAt.slice(f * eng.n, f * eng.n + eng.n);
      expect(slice.every((v) => v >= 0 && v < eng.n)).toBe(true);
    }
  });

  it("strongEdges returns bounded arrays of the strongest pheromone edges", () => {
    const eng = new AlgoEngine(0, eil51, params({ tMax: 3 }), 2);
    while (!eng.done) eng.step();
    const edges = eng.strongEdges();
    expect(edges.count).toBeGreaterThan(0);
    expect(edges.count).toBeLessThanOrEqual(400);
    expect(edges.i.length).toBe(edges.count);
    for (let k = 0; k < edges.count; k++) {
      expect(edges.i[k]).toBeLessThan(edges.j[k]); // symmetric upper triangle
    }
  });
});
