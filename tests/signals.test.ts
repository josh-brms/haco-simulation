import { describe, it, expect } from "vitest";
import { shannonEntropy, pdr } from "@/sim/signals";
import { twoOpt, tourDistance } from "@/sim/local-search";
import { distanceMatrix } from "@/sim/distance";
import { nearestNeighborTour } from "@/sim/tour";
import { createRng } from "@/sim/rng";

describe("shannonEntropy (entropy_pdr.shannon_entropy)", () => {
  it("is 0 bits when every ant builds the identical tour", () => {
    const tours = new Int32Array([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]);
    expect(shannonEntropy(tours, 4, 3)).toBeCloseTo(0, 9);
  });

  it("grows as the population diverges", () => {
    const same = new Int32Array([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]);
    const mixed = new Int32Array([0, 1, 2, 3, 0, 2, 1, 3, 1, 0, 2, 3]);
    expect(shannonEntropy(same, 4, 3)).toBeLessThan(shannonEntropy(mixed, 4, 3));
  });

  it("handles a single ant (one deterministic edge set)", () => {
    const tours = new Int32Array([0, 1, 2]);
    expect(shannonEntropy(tours, 3, 1)).toBeCloseTo(0, 9);
  });
});

describe("pdr (entropy_pdr.pdr)", () => {
  it("is 1.0 on a uniform active matrix", () => {
    const tau = new Float64Array(9).fill(0.5);
    tau[0] = tau[4] = tau[8] = 0;
    expect(pdr(tau)).toBeCloseTo(1.0, 9);
  });

  it("is 1.0 when the matrix is empty", () => {
    expect(pdr(new Float64Array(9))).toBe(1.0);
  });

  it("equals max/mean over active entries", () => {
    const tau = new Float64Array([0, 4, 0, 4, 0, 1, 0, 1, 0]);
    expect(pdr(tau)).toBeCloseTo(4 / 2.5, 9);
  });

  it("grows as pheromone concentrates on few edges", () => {
    const tau = new Float64Array([0, 10, 0, 10, 0, 0.1, 0, 0.1, 0]);
    expect(pdr(tau)).toBeGreaterThan(1.5);
  });
});

describe("twoOpt (two_opt.py best-improvement)", () => {
  const coords: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 1],
    [0, 1],
  ];
  const d = distanceMatrix(coords);

  it("removes crossing edges and shortens the tour", () => {
    const crossing = Int32Array.from([0, 3, 1, 4, 2, 5]);
    const improved = twoOpt(crossing, d, 6);
    expect(tourDistance(d, 6, improved)).toBeLessThan(tourDistance(d, 6, crossing));
  });

  it("reaches a 2-opt local optimum (idempotent)", () => {
    const once = twoOpt(Int32Array.from([0, 3, 1, 4, 2, 5]), d, 6);
    const twice = twoOpt(once, d, 6);
    expect(tourDistance(d, 6, twice)).toBeCloseTo(tourDistance(d, 6, once), 9);
  });

  it("never lengthens the tour", () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = createRng(seed);
      const perm = Int32Array.from([0, 1, 2, 3, 4, 5].sort(() => rng() - 0.5));
      const improved = twoOpt(perm, d, 6);
      expect(tourDistance(d, 6, improved)).toBeLessThanOrEqual(tourDistance(d, 6, perm));
    }
  });

  it("tourDistance includes the closing edge", () => {
    const tour = Int32Array.from([1, 2, 3, 0, 4, 5]);
    let expected = 0;
    for (let k = 0; k < 6; k++) expected += d[tour[k] * 6 + tour[(k + 1) % 6]];
    expect(tourDistance(d, 6, tour)).toBeCloseTo(expected, 9);
  });
});

describe("nearestNeighborTour (tsplib.nearest_neighbor_tour)", () => {
  it("visits every city exactly once", () => {
    const coords: [number, number][] = [
      [0, 0],
      [5, 5],
      [2, 1],
      [7, 0],
      [1, 9],
    ];
    const d = distanceMatrix(coords);
    const { tour } = nearestNeighborTour(d, 5, createRng(1));
    expect([...tour].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });
});
