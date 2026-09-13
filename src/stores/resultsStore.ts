import { create } from "zustand";
import type { AlgoId, BenchmarkParams } from "@/sim/engine";
import type { InstanceName } from "@/sim/instances";

export interface StoredAlgoResult {
  algo: AlgoId;
  bestDist: number;
  convergenceIter: number;
  activations: number;
  runtimeS: number;
}

export interface StoredTrial {
  trial: number;
  seed: number;
  perAlgo: StoredAlgoResult[];
  series: {
    algo: AlgoId;
    best: number[];
    entropy: number[];
    dominance: number[];
    triggered: boolean[];
  }[];
}

export interface StoredRun {
  id: number;
  timestamp: number;
  instanceName: InstanceName;
  params: BenchmarkParams & { trials: number };
  trialsData: StoredTrial[];
}

interface ResultsState {
  runs: StoredRun[];
  selectedId: number | null;
  addRun: (run: Omit<StoredRun, "id" | "timestamp">) => number;
  select: (id: number | null) => void;
  deleteRun: (id: number) => void;
  clearAll: () => void;
}

let nextId = 1;

export const useResultsStore = create<ResultsState>((set) => ({
  runs: [],
  selectedId: null,

  addRun: (run) => {
    const id = nextId++;
    set((s) => ({ runs: [{ ...run, id, timestamp: Date.now() }, ...s.runs] }));
    return id;
  },

  select: (id) => set({ selectedId: id }),

  deleteRun: (id) =>
    set((s) => ({
      runs: s.runs.filter((r) => r.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  clearAll: () => set({ runs: [], selectedId: null }),
}));
