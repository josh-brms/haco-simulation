# Entropy-Triggered HACO Benchmark

Desktop companion for the thesis **"A Statistically Validated Multi-Instance Evaluation of Entropy-Triggered 2-Opt in Hybrid Ant Colony Optimization"** by Joshua Bermas, Vincent Brian Somido, and John Earl Mirabete — Divine Word College of Legazpi, March 2026.

Built with Tauri 2 (Rust shell), React 19 + TypeScript, Three.js via react-three-fiber, Recharts, and TailwindCSS (zinc theme).

## Thesis Overview

Ant Colony Optimization (ACO) is a widely applied metaheuristic for combinatorial routing problems such as the Traveling Salesman Problem (TSP), but its positive-feedback pheromone mechanism causes premature convergence. Hybrid ACO (HACO) addresses this by adding a 2-opt local search operator, yet the prevailing practice of invoking 2-opt at every iteration imposes a cumulative O(n²) cost.

This study proposes an **Adaptive HACO** in which 2-opt is applied to the global best tour only when a dual-signal condition is met: Shannon entropy H(S) falls below a calibrated stagnation threshold θ, and the Pheromone Dominance Ratio PDR(t) exceeds τ_PDR = 2.0, confirming over-exploitation.

### Key Results

| Metric | Finding |
|--------|---------|
| Runtime reduction | 9.9% to 23.4% vs Non-adaptive HACO (p < 0.001 on all 6 instances) |
| 2-opt activation | 20.4% to 53.9% of iterations (vs 100% for Non-adaptive) |
| Solution quality | Shortest mean tours on 5 of 6 instances (2.51% to 4.01% gap) |
| Convergence | Met criterion 15.6–22.3 iterations later (honest null result) |

## Pages

- **Run** - Configure and execute multi-trial benchmarks: TSPLIB instance selection, trial count (default 30), algorithm parameters (α, β, ρ, Q, m, T_max), and playback speed. The visualization shows real-time 3D city maps with pheromone trails, live convergence/entropy/PDR charts, per-algorithm comparison, and matching source code.
- **Simulate** - Step through a single trial iteration-by-iteration: line-highlighted code stepper, variable inspector (H(S), θ, PDR, τ_PDR), scrubber, run-structure pipeline, and process log recording every 2-opt trigger event.
- **Results** - History of completed benchmark runs with detail view (pooled charts, aggregates, plain-language interpretation) and export to Markdown/HTML/PDF.

## Algorithm Conditions

Three configurations compared under identical shared parameters (α=1.0, β=5.0, ρ=0.5, m=30, Q=1.0, T_max=500):

1. **Standard ACO** — plain Ant System, no local search. Baseline.
2. **Non-adaptive HACO** — 2-opt applied to the best tour at every iteration. Maximum local search cost.
3. **Proposed Adaptive HACO** — greedy-seeded initialization; 2-opt only when H(S) < θ AND PDR > τ_PDR. Selective refinement.

Convergence criterion: first iteration t where relative improvement ≤ ε=0.001 over a sliding window of W=20 iterations, else T_max.

## Simulation Core

TypeScript implementation of the thesis Python code, one module per concern:

| Module | Responsibility |
|---|---|
| `sim/rng.ts` | Deterministic PRNG (mulberry32) with per-trial/per-algorithm streams |
| `sim/distance.ts` | Dense Euclidean distance matrix |
| `sim/tour.ts` | Tour length, closing edge, nearest-neighbour construction |
| `sim/pheromone.ts` | τ₀ = 1/(n·L_nn), greedy boost, evaporation + Q/L deposit |
| `sim/construct.ts` | AS transition rule (τ^α · η^β, roulette wheel) |
| `sim/signals.ts` | Shannon entropy H(S) and Pheromone Dominance Ratio |
| `sim/local-search.ts` | Best-improvement 2-opt with thesis tie-breaking |
| `sim/engine.ts` | Three algorithm conditions + incremental stepping |

## TSPLIB Benchmark Instances

| Instance | Nodes | Optimum | θ (entropy threshold) | τ_PDR |
|----------|-------|---------|----------------------|-------|
| eil51 | 51 | 426 | 47.24 | 2.0 |
| berlin52 | 52 | 7,542 | 59.88 | 2.0 |
| eil76 | 76 | 538 | 64.07 | 2.0 |
| kroA100 | 100 | 21,282 | 91.08 | 2.0 |
| kroB150 | 150 | 26,130 | 90.82 | 2.0 |
| kroA200 | 200 | 29,368 | 142.78 | 2.0 |

θ values are the 30th percentile of the Shannon entropy distribution from calibration runs (thesis Table 3.3).

## Development

```bash
npm install
npm run dev        # web-only dev server on :1420
npm test           # vitest unit + integration tests
npm run build      # typecheck + production build
```

## Desktop Shell (Tauri 2)

Prerequisites on Linux (Fedora):

```bash
sudo dnf install -y gtk3-devel webkit2gtk4.1-devel gdk-pixbuf2-devel librsvg2-devel
# rust via rustup
```

```bash
npm run tauri:dev      # native window with hot reload
npm run tauri:build    # deb/appimage/rpm bundles
```

Native commands exposed to the webview: `ping`, `engine_info`, `export_report`.

## Testing

- `tests/signals.test.ts` - entropy, PDR, 2-opt, NN tour properties vs Python reference
- `tests/engine.test.ts` - determinism, monotone best-length, trigger sparsity, quality parity, optimum gaps
- `tests/stores.test.ts` - run lifecycle, trial chaining, sim stepping/scrubbing, results archive
- `tests/{Run,Simulate,Results}Page.test.tsx` - UI integration tests
- `tests/e2e-smoke.mjs` - real-Chrome end-to-end journey

## References

- Dorigo, M., & Stützle, T. (2004). *Ant Colony Optimization*. MIT Press.
- Lin, S., & Kernighan, B. W. (1973). An effective heuristic algorithm for the traveling salesman problem. *Operations Research*, 21(2), 498–516.
- Nie, X., Wang, H., & Nie, H. (2023). Adaptive ant colony optimization algorithm based on information entropy for robot path planning. *Symmetry*, 15(4), 785.
- Reinelt, G. (1991). TSPLIB — A traveling salesman problem library. *ORSA Journal on Computing*, 3(4), 376–384.
- Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423.
