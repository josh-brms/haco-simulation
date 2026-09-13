import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RunPage from "@/pages/RunPage";
import { useRunStore } from "@/stores/runStore";
import { useResultsStore } from "@/stores/resultsStore";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <RunPage />
    </MemoryRouter>
  );

describe("RunPage - parameter stage", () => {
  beforeEach(() => {
    useRunStore.getState().stop();
    useResultsStore.getState().clearAll();
  });

  it("shows the parameter configuration BEFORE any visuals", () => {
    renderPage();
    // parameters present
    expect(screen.getByTestId("instance-select")).toBeInTheDocument();
    expect(screen.getByTestId("trials")).toBeInTheDocument();
    expect(screen.getByTestId("tmax")).toBeInTheDocument();
    expect(screen.getByTestId("ants")).toBeInTheDocument();
    expect(screen.getByTestId("seed")).toBeInTheDocument();
    expect(screen.getByTestId("alpha")).toBeInTheDocument();
    expect(screen.getByTestId("beta")).toBeInTheDocument();
    expect(screen.getByTestId("rho")).toBeInTheDocument();
    expect(screen.getByTestId("q")).toBeInTheDocument();
    expect(screen.getByTestId("start-btn")).toBeInTheDocument();
    // visuals NOT yet present
    expect(screen.queryByTestId("chart-convergence")).not.toBeInTheDocument();
    expect(screen.queryByTestId("code-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pause-btn")).not.toBeInTheDocument();
  });

  it("shows instance metadata (optimum, theta, tau) on the config stage", () => {
    renderPage();
    expect(screen.getByText(/426/)).toBeInTheDocument(); // eil51 optimum
    expect(screen.getByText(/47\.24/)).toBeInTheDocument(); // theta
    expect(screen.getByText((content) => content.includes("PDR") && content.includes("threshold"))).toBeInTheDocument();
  });

  it("selects a different instance from the config stage", () => {
    renderPage();
    const select = screen.getByTestId("instance-select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "berlin52" } });
    expect(useRunStore.getState().instanceName).toBe("berlin52");
  });

  it("validates parameter bounds", () => {
    renderPage();
    const set = (id: string, value: string) => {
      const input = screen.getByTestId(id) as HTMLInputElement;
      fireEvent.change(input, { target: { value } });
    };
    set("trials", "0");
    expect(useRunStore.getState().trialCount).toBe(1);
    set("trials", "500");
    expect(useRunStore.getState().trialCount).toBe(100);
    set("rho", "1.5");
    expect(useRunStore.getState().params.rho).toBe(0.99);
    set("rho", "0.05");
    expect(useRunStore.getState().params.rho).toBe(0.05);
    set("ants", "3");
    expect(useRunStore.getState().params.ants).toBe(5);
  });

  it("start shows the loader, then moves to the visualization stage", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    // loader is visible while engines are prepared
    await waitFor(() => expect(screen.getByTestId("loader")).toBeInTheDocument());
    await waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    await waitFor(() => expect(screen.getByTestId("pause-btn")).toBeInTheDocument());
    // visuals now present
    expect(screen.getByTestId("chart-convergence")).toBeInTheDocument();
    expect(screen.getByTestId("chart-entropy")).toBeInTheDocument();
    expect(screen.getByTestId("chart-pdr")).toBeInTheDocument();
    expect(screen.getByTestId("code-panel")).toBeInTheDocument();
    expect(screen.getByTestId("map3d-canvas")).toBeInTheDocument();
  });

  it("hides the loader once the run is live", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    await waitFor(() => expect(screen.getByTestId("loader")).toBeInTheDocument());
    await waitFor(() => expect(useRunStore.getState().status).toBe("running"));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());
  });

  it("pauses and resumes from the visual stage", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    await waitFor(() => expect(screen.getByTestId("pause-btn")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("pause-btn"));
    expect(useRunStore.getState().status).toBe("paused");
    await waitFor(() => expect(screen.getByTestId("resume-btn")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("resume-btn"));
    expect(useRunStore.getState().status).toBe("running");
  });

  it("stop returns to the parameter stage", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    await waitFor(() => expect(screen.getByTestId("pause-btn")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("stop-btn"));
    expect(useRunStore.getState().status).toBe("config");
    expect(screen.getByTestId("start-btn")).toBeInTheDocument();
  });

  it("switches the active algorithm tab in the visual stage", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    await waitFor(() => expect(screen.getByTestId("algo-tab-1")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("algo-tab-1"));
    expect(screen.getByTestId("algo-tab-1").className).toContain("text-green-400");
  });

  it("archives the run in results on completion", async () => {
    useRunStore.getState().setInstance("eil51");
    useRunStore.getState().setTrialCount(1);
    useRunStore.getState().setParam("tMax", 10);
    renderPage();
    fireEvent.click(screen.getByTestId("start-btn"));
    await waitFor(() => expect(useRunStore.getState().status).toBe("completed"), { timeout: 30000 });
    expect(useResultsStore.getState().runs).toHaveLength(1);
    expect(useResultsStore.getState().runs[0].instanceName).toBe("eil51");
    // New Run button returns to config
    fireEvent.click(screen.getByTestId("new-run-btn"));
    expect(useRunStore.getState().status).toBe("config");
  });
});
