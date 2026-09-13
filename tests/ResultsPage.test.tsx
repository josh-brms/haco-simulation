import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResultsPage from "@/pages/ResultsPage";
import { useResultsStore, type StoredRun } from "@/stores/resultsStore";
import { exportMarkdown, exportHtml, aggregateRun } from "@/lib/export";
import { ALGO_NAMES } from "@/sim/engine";
import { INSTANCES } from "@/sim/instances";

const makeRun = (over: Partial<StoredRun> = {}): Omit<StoredRun, "id" | "timestamp"> => ({
  instanceName: "eil51",
  params: { trials: 2, tMax: 100, alpha: 1, beta: 5, rho: 0.5, Q: 1, ants: 30, seed: 0, greedyBoost: 10 },
  trialsData: [0, 1].map((trial) => ({
    trial,
    seed: trial,
    perAlgo: [
      { algo: 0, bestDist: 460 + trial, convergenceIter: 180, activations: 0, runtimeS: 0.5 },
      { algo: 1, bestDist: 444 + trial, convergenceIter: 60, activations: 100, runtimeS: 1.2 },
      { algo: 2, bestDist: 440 + trial, convergenceIter: 70, activations: 45, runtimeS: 0.9 },
    ],
    series: [
      { algo: 0, best: Array(100).fill(460), entropy: Array(100).fill(50), dominance: Array(100).fill(1.5), triggered: Array(100).fill(false) },
      { algo: 1, best: Array(100).fill(444), entropy: Array(100).fill(50), dominance: Array(100).fill(1.5), triggered: Array(100).fill(false) },
      { algo: 2, best: Array(100).fill(440), entropy: Array(100).fill(50), dominance: Array(100).fill(1.5), triggered: Array(100).fill(false) },
    ],
  })),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>
  );

describe("ResultsPage", () => {
  beforeEach(() => {
    useResultsStore.getState().clearAll();
  });

  it("shows the empty state before any run", () => {
    renderPage();
    expect(screen.getByText(/No benchmark runs yet/i)).toBeInTheDocument();
  });

  it("lists runs with instance, date, trial count, and best mean gap", () => {
    useResultsStore.getState().addRun(makeRun());
    renderPage();
    expect(screen.getByTestId("history-table")).toBeInTheDocument();
    expect(screen.getByText("eil51")).toBeInTheDocument();
    // adaptive mean (440+441)/2 = 440.5 vs optimum 426 -> ~3.40%
    expect(screen.getByText(/Adaptive HACO: 3\.40%/i)).toBeInTheDocument();
  });

  it("opens run detail with export actions, then goes back", () => {
    const id = useResultsStore.getState().addRun(makeRun());
    renderPage();
    fireEvent.click(screen.getByTestId(`view-${id}`));
    expect(screen.getByText(`Run #${id} - eil51`)).toBeInTheDocument();
    expect(screen.getByTestId("export-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("export-html")).toBeInTheDocument();
    expect(screen.getByTestId("export-md")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("back-btn"));
    expect(screen.getByTestId("history-table")).toBeInTheDocument();
  });

  it("clears all runs", () => {
    useResultsStore.getState().addRun(makeRun());
    renderPage();
    fireEvent.click(screen.getByText(/Clear history/i));
    expect(screen.getByText(/No benchmark runs yet/i)).toBeInTheDocument();
  });
});

describe("report generation", () => {
  beforeEach(() => {
    useResultsStore.getState().clearAll();
  });

  it("aggregates mean/SD/gap per algorithm", () => {
    const run = { ...makeRun(), id: 1, timestamp: Date.now() } as StoredRun;
    const agg = aggregateRun(run);
    expect(agg).toHaveLength(3);
    const adaptive = agg.find((a) => a.algo === 2)!;
    expect(adaptive.meanBest).toBeCloseTo(440.5, 6);
    const optimum = INSTANCES.eil51.optimum;
    expect(adaptive.gapPct).toBeCloseTo(((440.5 - optimum) / optimum) * 100, 6);
    expect(adaptive.meanActivations).toBeCloseTo(45, 6);
  });

  it("markdown report contains summary, table, and interpretation", () => {
    const run = { ...makeRun(), id: 1, timestamp: 1700000000000 } as StoredRun;
    const md = exportMarkdown(run);
    expect(md).toContain("# Benchmark Report: eil51");
    expect(md).toContain("α=1, β=5, ρ=0.5");
    for (const name of Object.values(ALGO_NAMES)) {
      expect(md).toContain(name);
    }
    expect(md).toContain("## Interpretation");
    expect(md).toContain("2-opt");
    expect(md).toContain("Entropy-Triggered HACO Benchmark");
  });

  it("html report is a complete document with a results table", () => {
    const run = { ...makeRun(), id: 1, timestamp: 1700000000000 } as StoredRun;
    const html = exportHtml(run);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Benchmark Report: eil51");
    expect(html).toContain("<table>");
    expect(html).toContain("Proposed Adaptive HACO");
    expect(html).toContain("<svg");
    expect(html).toContain("Entropy-Triggered HACO Benchmark");
    expect(html.trim().endsWith("</html>")).toBe(true);
  });
});
