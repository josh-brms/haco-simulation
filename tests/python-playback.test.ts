import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useRunStore,
  buildPythonTrial,
  buildPlaybackEngines,
  PythonPlaybackEngine,
  reconstructBestTourAt,
} from "@/stores/runStore";
import type { PythonTrialResult } from "@/lib/native";

vi.mock("@/lib/native", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/native")>();
  return {
    ...actual,
    isTauri: () => true,
    runPythonTrial: vi.fn(),
  };
});

const { runPythonTrial } = await import("@/lib/native");
const mockRunPythonTrial = runPythonTrial as unknown as ReturnType<typeof vi.fn>;

function syntheticRaw(seed: number, tMax: number, n: number): PythonTrialResult[] {
  const algos = ["standard_aco", "nonadaptive_haco", "adaptive_haco"];
  return algos.map((algo, a) => {
    const best_history = Array.from({ length: tMax }, (_, t) => 500 - t * (a + 1) - seed);
    const entropy_history = Array.from({ length: tMax }, (_, t) => 60 - t * 0.1);
    const pdr_history = Array.from({ length: tMax }, (_, t) => 1 + t * 0.05);
    const triggered_history = Array.from({ length: tMax }, (_, t) => algo === "adaptive_haco" && t % 10 === 0);
    const tour = Array.from({ length: n }, (_, i) => (i + seed) % n);
    const rev = [...tour].reverse();
    return {
      algo,
      seed,
      best_dist: best_history[tMax - 1],
      convergence_iter: tMax,
      n_activations: triggered_history.filter(Boolean).length,
      time_s: 0.5 + a * 0.1,
      best_history,
      entropy_history,
      entropy_at_trigger: [],
      pdr_at_trigger: [],
      pdr_history,
      triggered_history,
      best_tour_final: tour,
      tour_frames: [0, Math.floor(tMax / 2)],
      tour_snapshots: [tour, rev],
    };
  });
}

describe("reconstructBestTourAt", () => {
  it("forward-fills sparse snapshots and leaves pre-first frames empty", () => {
    const n = 4;
    const tourA = [0, 1, 2, 3];
    const tourB = [0, 2, 1, 3];
    const buf = reconstructBestTourAt(n, 6, [{ frame: 2, tour: tourA }, { frame: 4, tour: tourB }], tourB);
    expect(Array.from(buf.slice(0, 4))).toEqual([-1, -1, -1, -1]);
    expect(Array.from(buf.slice(2 * n, 3 * n))).toEqual(tourA);
    expect(Array.from(buf.slice(3 * n, 4 * n))).toEqual(tourA);
    expect(Array.from(buf.slice(4 * n, 5 * n))).toEqual(tourB);
  });

  it("honors a frame -1 baseline tour", () => {
    const n = 3;
    const buf = reconstructBestTourAt(n, 3, [{ frame: -1, tour: [2, 0, 1] }], [2, 0, 1]);
    expect(Array.from(buf.slice(0, 3))).toEqual([2, 0, 1]);
  });

  it("stays empty when no tour data is available", () => {
    const buf = reconstructBestTourAt(4, 5, [], []);
    expect(Array.from(buf).every((v) => v === -1)).toBe(true);
  });
});

describe("PythonPlaybackEngine", () => {
  it("reveals series progressively and tracks best/tour state", () => {
    const tMax = 10;
    const n = 4;
    const raw = syntheticRaw(0, tMax, n)[2];
    const tourSnapshots: Array<{ frame: number; tour: number[] }> = raw.tour_frames.map(
      (frame, i) => ({ frame, tour: raw.tour_snapshots[i] ?? [] })
    );
    const engine = new PythonPlaybackEngine(
      2,
      n,
      { best: raw.best_history, entropy: raw.entropy_history, dominance: raw.pdr_history, triggered: raw.triggered_history },
      tMax,
      raw.time_s,
      tourSnapshots,
      raw.best_tour_final
    );
    expect(engine.done).toBe(false);
    expect(engine.currentBest).toBe(Infinity);
    expect(engine.best).toHaveLength(0);

    const snap = engine.step()!;
    expect(snap.frame).toBe(0);
    expect(engine.best).toHaveLength(1);
    expect(engine.currentBest).toBe(raw.best_history[0]);
    expect(engine.currentFrame).toBe(1);

    while (!engine.done) engine.step();
    expect(engine.best).toHaveLength(tMax);
    expect(engine.currentBest).toBe(raw.best_history[tMax - 1]);
    expect(engine.activations).toBe(raw.n_activations);
    expect(engine.step()).toBeNull();

    // Tour buffer shows the first snapshot at frame 0 and switches midway.
    expect(Array.from(engine.bestTourAt.slice(0, n))).toEqual(raw.tour_snapshots[0]);
    expect(Array.from(engine.bestTourAt.slice(5 * n, 6 * n))).toEqual(raw.tour_snapshots[1]);

    // Trails: all edges have a small baseline so the web is visible,
    // tour edges are strongest. For small n all pairs fit under the cap.
    const engine2 = new PythonPlaybackEngine(
      0, n,
      { best: raw.best_history, entropy: raw.entropy_history, dominance: raw.pdr_history, triggered: raw.triggered_history },
      tMax, raw.time_s, tourSnapshots, raw.best_tour_final
    );
    const allPairs = (n * (n - 1)) / 2;
    expect(engine2.strongEdges().count).toBe(allPairs);
    engine2.step();
    expect(engine2.strongEdges().count).toBe(allPairs);

    // With no tour data at all, trails stay empty.
    const engine3 = new PythonPlaybackEngine(
      0, n,
      { best: raw.best_history, entropy: raw.entropy_history, dominance: raw.pdr_history, triggered: raw.triggered_history },
      tMax, raw.time_s, [], []
    );
    expect(engine3.strongEdges().count).toBe(0);
  });
});

describe("buildPythonTrial", () => {
  it("maps per-iteration histories (not trigger-point snapshots)", () => {
    const raw = syntheticRaw(7, 12, 5);
    const trial = buildPythonTrial(0, 7, raw);
    expect(trial.trial).toBe(0);
    expect(trial.seed).toBe(7);
    expect(trial.perAlgo).toHaveLength(3);
    const adaptive = trial.series.find((s) => s.algo === 2)!;
    expect(adaptive.best).toHaveLength(12);
    expect(adaptive.dominance).toEqual(raw[2].pdr_history);
    expect(adaptive.triggered).toEqual(raw[2].triggered_history);
    expect(trial.perAlgo.find((p) => p.algo === 2)!.activations).toBe(raw[2].n_activations);
  });
});

describe("python run lifecycle (mocked Tauri)", () => {
  beforeEach(() => {
    useRunStore.getState().stop();
    vi.clearAllMocks();
  });

  it("enters the visual stage with playback engines and replays to completed", async () => {
    mockRunPythonTrial.mockImplementation(async (instanceName: string, seed: number, params: { tMax: number }) =>
      syntheticRaw(seed, params.tMax, 5)
    );
    const store = useRunStore.getState();
    store.setTrialCount(1);
    store.setParam("tMax", 12);
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().engines.length).toBe(3));
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    // Charts see progressive (not yet full) data right after load.
    expect(useRunStore.getState().engines[0].best.length).toBeLessThanOrEqual(1);

    for (let i = 0; i < 500 && useRunStore.getState().status !== "completed"; i++) {
      useRunStore.getState().advance();
    }
    const s = useRunStore.getState();
    expect(s.status).toBe("completed");
    expect(s.trials).toHaveLength(1);
    expect(s.trials[0].perAlgo).toHaveLength(3);
    // No duplicate trial appended by playback.
    expect(s.trials.filter((t) => t.trial === 0)).toHaveLength(1);
  });
});
