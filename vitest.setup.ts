import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom polyfills for three.js / recharts / code panel
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

if (typeof Element.prototype.scrollIntoView === "undefined") {
  Element.prototype.scrollIntoView = vi.fn();
}

if (typeof HTMLCanvasElement.prototype.getContext === "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
