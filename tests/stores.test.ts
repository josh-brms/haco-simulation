import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRunStore, aggregateTrials } from "@/stores/runStore";
import { useResultsStore } from "@/stores/resultsStore";
import { useSimStore } from "@/stores/simStore";

const flush = async (ms = 120) => {
  await new Promise((r) => setTimeout(r, ms));
};

describe("runStore lifecycle", () => {
  beforeEach(() => {
    useRunStore.getState().stop();
    useResultsStore.getState().clearAll();
  });

  it("starts in config stage with defaults", () => {
    const s = useRunStore.getState();
    expect(s.status).toBe("config");
    expect(s.instanceName).toBe("eil51");
    expect(s.trialCount).toBe(30);
    expect(s.params.alpha).toBe(1.0);
    expect(s.engines).toHaveLength(0);
  });

  it("startRun shows a loader, then moves to running with 3 engines", async () => {
    useRunStore.getState().startRun();
    expect(useRunStore.getState().preparing).toBe(true);
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    const s = useRunStore.getState();
    expect(s.preparing).toBe(false);
    expect(s.engines.map((e) => e.algo).sort()).toEqual([0, 1, 2]);
    expect(s.trials).toHaveLength(0);
  });

  it("advance() progresses the frame counter and edge cache", async () => {
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    useRunStore.getState().advance();
    const s = useRunStore.getState();
    expect(s.frame).toBeGreaterThan(0);
    expect(s.edgeCache[2].count).toBeGreaterThan(0);
  });

  it("pause/resume transitions are guarded", async () => {
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    useRunStore.getState().pause();
    expect(useRunStore.getState().status).toBe("paused");
    useRunStore.getState().resume();
    expect(useRunStore.getState().status).toBe("running");
    useRunStore.getState().pause();
    useRunStore.getState().resume();
    // resume is a no-op unless paused
    useRunStore.getState().resume();
    expect(useRunStore.getState().status).toBe("running");
  });

  it("stop() returns to the config stage and clears state", () => {
    useRunStore.getState().startRun();
    useRunStore.getState().advance();
    useRunStore.getState().stop();
    const s = useRunStore.getState();
    expect(s.status).toBe("config");
    expect(s.frame).toBe(0);
    expect(s.engines).toHaveLength(0);
    expect(s.trials).toHaveLength(0);
  });

  it("parameter edits are blocked while running", async () => {
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    useRunStore.getState().setInstance("berlin52");
    expect(useRunStore.getState().instanceName).toBe("eil51");
    useRunStore.getState().setParam("alpha", 9);
    expect(useRunStore.getState().params.alpha).toBe(1.0);
  });

  it("completes one tiny trial with results for all 3 algorithms", async () => {
    const store = useRunStore.getState();
    store.setTrialCount(1);
    store.setParam("tMax", 20);
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    for (let i = 0; i < 500 && useRunStore.getState().status !== "completed"; i++) {
      useRunStore.getState().advance();
      if (useRunStore.getState().preparing) await flush();
    }
    const s = useRunStore.getState();
    expect(s.status).toBe("completed");
    expect(s.trials).toHaveLength(1);
    expect(s.trials[0].perAlgo).toHaveLength(3);
    for (const engine of s.engines) {
      expect(engine.currentFrame).toBe(20);
      expect(engine.done).toBe(true);
    }
  });

  it("chains trials with paired seeds, then completes", async () => {
    const store = useRunStore.getState();
    store.setTrialCount(2);
    store.setParam("tMax", 10);
    useRunStore.getState().startRun();
    await vi.waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    for (let i = 0; i < 2000 && useRunStore.getState().status !== "completed"; i++) {
      useRunStore.getState().advance();
      if (useRunStore.getState().preparing) await flush();
    }
    const s = useRunStore.getState();
    expect(s.status).toBe("completed");
    expect(s.trials).toHaveLength(2);
    expect(s.trials[0].seed).toBe(s.params.seed);
    expect(s.trials[1].seed).toBe(s.params.seed + 1);
  });
});

describe("aggregateTrials", () => {
  it("computes means and gap percentages per algorithm", () => {
    const trials = [
      {
        trial: 0,
        seed: 0,
        perAlgo: [
          { algo: 0, bestDist: 460, convergenceIter: 180, activations: 0, runtimeS: 0.5 },
          { algo: 1, bestDist: 446, convergenceIter: 60, activations: 100, runtimeS: 1.2 },
          { algo: 2, bestDist: 440, convergenceIter: 70, activations: 45, runtimeS: 0.9 },
        ],
        series: [],
      },
      {
        trial: 1,
        seed: 1,
        perAlgo: [
          { algo: 0, bestDist: 462, convergenceIter: 190, activations: 0, runtimeS: 0.5 },
          { algo: 1, bestDist: 448, convergenceIter: 62, activations: 102, runtimeS: 1.2 },
          { algo: 2, bestDist: 442, convergenceIter: 72, activations: 47, runtimeS: 0.9 },
        ],
        series: [],
      },
    ] as never[];

    const agg = aggregateTrials("eil51", trials);
    const adaptive = agg.find((a) => a.algo === 2)!;
    expect(adaptive.meanBest).toBeCloseTo(441, 6);
    expect(adaptive.meanGapPct).toBeCloseTo(((441 - 426) / 426) * 100, 6);
    expect(adaptive.meanActivations).toBeCloseTo(46, 6);
  });
});

describe("resultsStore", () => {
  beforeEach(() => {
    useResultsStore.getState().clearAll();
  });

  const sampleRun = () => ({
    instanceName: "eil51" as const,
    params: { trials: 2, tMax: 100, alpha: 1, beta: 5, rho: 0.5, Q: 1, ants: 30, seed: 0, greedyBoost: 10 },
    trialsData: [],
  });

  it("adds runs newest-first with incrementing ids", () => {
    const id1 = useResultsStore.getState().addRun(sampleRun());
    const id2 = useResultsStore.getState().addRun({ ...sampleRun(), instanceName: "berlin52" });
    expect(id2).toBe(id1 + 1);
    expect(useResultsStore.getState().runs[0].instanceName).toBe("berlin52");
  });

  it("selects, deletes, and clears", () => {
    const id = useResultsStore.getState().addRun(sampleRun());
    useResultsStore.getState().select(id);
    expect(useResultsStore.getState().selectedId).toBe(id);
    useResultsStore.getState().deleteRun(id);
    expect(useResultsStore.getState().selectedId).toBeNull();
    expect(useResultsStore.getState().runs).toHaveLength(0);
  });
});

describe("simStore lifecycle", () => {
  beforeEach(() => {
    useSimStore.getState().reset();
  });

  it("prepare creates the engine and logs initialization", async () => {
    useSimStore.getState().prepare();
    expect(useSimStore.getState().preparing).toBe(true);
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    const s = useSimStore.getState();
    expect(s.preparing).toBe(false);
    expect(s.status).toBe("paused");
    expect(s.logs).toHaveLength(1);
    expect(s.vars.theta).toBeCloseTo(47.2437, 3);
  });

  it("advance() steps one iteration and refreshes variables", async () => {
    useSimStore.getState().prepare();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    useSimStore.getState().advance();
    const s = useSimStore.getState();
    expect(s.frame).toBe(1);
    expect(s.vars.bestLen).toBeLessThan(Infinity);
    expect(s.vars.entropy).toBeGreaterThan(0);
  });

  it("stepOnce pauses after a single step", async () => {
    useSimStore.getState().play();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    useSimStore.getState().stepOnce();
    const s = useSimStore.getState();
    expect(s.status).toBe("paused");
    expect(s.frame).toBe(1);
  });

  it("scrubTo fast-forwards to any iteration via chunked loading", async () => {
    useSimStore.getState().prepare();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    useSimStore.getState().scrubTo(75);
    await vi.waitFor(() => expect(useSimStore.getState().preparing).toBe(false));
    const s = useSimStore.getState();
    expect(s.frame).toBe(75);
    expect(s.engine!.best).toHaveLength(75);
  });

  it("scrub cannot rewind below the current frame", async () => {
    useSimStore.getState().prepare();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    useSimStore.getState().scrubTo(50);
    await vi.waitFor(() => expect(useSimStore.getState().preparing).toBe(false));
    useSimStore.getState().scrubTo(10);
    await flush();
    expect(useSimStore.getState().frame).toBe(50);
  });

  it("records a trigger log entry when the adaptive condition fires", async () => {
    useSimStore.getState().prepare();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    let fired = false;
    for (let i = 0; i < 500; i++) {
      useSimStore.getState().advance();
      if (useSimStore.getState().vars.triggered) {
        fired = true;
        break;
      }
    }
    expect(fired).toBe(true);
    expect(useSimStore.getState().logs.some((l) => l.level === "trigger")).toBe(true);
  });

  it("marks done after T_max and resets to config", async () => {
    useSimStore.getState().setParam("tMax", 5);
    useSimStore.getState().prepare();
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    for (let i = 0; i < 10; i++) useSimStore.getState().advance();
    expect(useSimStore.getState().status).toBe("done");
    useSimStore.getState().reset();
    expect(useSimStore.getState().status).toBe("config");
    expect(useSimStore.getState().engine).toBeNull();
  });
});
