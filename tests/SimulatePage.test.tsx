import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SimulatePage from "@/pages/SimulatePage";
import { useSimStore } from "@/stores/simStore";

const renderPage = () =>
  render(
    <MemoryRouter>
      <SimulatePage />
    </MemoryRouter>
  );

describe("SimulatePage", () => {
  beforeEach(() => {
    useSimStore.getState().reset();
  });

  it("renders start button, scrubber, process log, run structure, and inspector", () => {
    renderPage();
    expect(screen.getByTestId("sim-play")).toBeInTheDocument();
    expect(screen.getByTestId("sim-scrubber")).toBeInTheDocument();
    expect(screen.getByTestId("process-log")).toBeInTheDocument();
    expect(screen.getByTestId("phase-init")).toBeInTheDocument();
    expect(screen.getByTestId("phase-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("var-inspector")).toBeInTheDocument();
  });

  it("start shows the loader, creates the engine, and enters playing state", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    expect(useSimStore.getState().status).toBe("playing");
    await waitFor(() => expect(screen.getByTestId("loader")).toBeInTheDocument());
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());
  });

  it("step advances exactly one iteration and pauses", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    fireEvent.click(screen.getByTestId("sim-pause"));
    const before = useSimStore.getState().frame;
    fireEvent.click(screen.getByTestId("sim-step"));
    expect(useSimStore.getState().frame).toBe(before + 1);
    expect(useSimStore.getState().status).toBe("paused");
  });

  it("run-structure pipeline highlights the active phase", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    fireEvent.click(screen.getByTestId("sim-pause"));
    const active = document.querySelector('[data-testid^="phase-"].border-green-600\\/50');
    expect(active).not.toBeNull();
  });

  it("scrubber reflects and drives the current frame", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    fireEvent.click(screen.getByTestId("sim-pause"));
    const scrubber = screen.getByTestId("sim-scrubber") as HTMLInputElement;
    expect(Number(scrubber.value)).toBe(useSimStore.getState().frame);
    fireEvent.change(scrubber, { target: { value: "25" } });
    await vi.waitFor(() => expect(useSimStore.getState().preparing).toBe(false));
    expect(useSimStore.getState().frame).toBe(25);
  });

  it("reset returns to a fresh configuration state", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    fireEvent.click(screen.getByTestId("sim-pause"));
    fireEvent.click(screen.getByTestId("sim-step"));
    fireEvent.click(screen.getByTestId("sim-reset"));
    const s = useSimStore.getState();
    expect(s.status).toBe("config");
    expect(s.engine).toBeNull();
    expect(s.frame).toBe(0);
  });

  it("rate input accepts value of 1 without snapping to default", async () => {
    renderPage();
    const rateInput = screen.getByTestId("sim-rate") as HTMLInputElement;
    fireEvent.change(rateInput, { target: { value: "1" } });
    expect(rateInput.value).toBe("1");
    expect(useSimStore.getState().iterationsPerSecond).toBe(1);
  });

  it("rate input rejects values below 1", async () => {
    renderPage();
    const rateInput = screen.getByTestId("sim-rate") as HTMLInputElement;
    fireEvent.change(rateInput, { target: { value: "0" } });
    expect(rateInput.value).toBe("20");
  });

  it("variable inspector shows entropy, PDR, and trigger state", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sim-play"));
    await vi.waitFor(() => expect(useSimStore.getState().engine).not.toBeNull());
    fireEvent.click(screen.getByTestId("sim-pause"));
    const inspector = screen.getByTestId("var-inspector");
    expect(inspector.textContent).toContain("H(S)");
    expect(inspector.textContent).toContain("PDR");
    expect(inspector.textContent).toContain("Best L*");
  });
});
