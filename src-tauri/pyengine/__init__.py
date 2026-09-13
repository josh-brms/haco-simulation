"""pyengine - Python ACO engine for thesis-exact results.

Entry point called from Rust via PyO3. Accepts JSON-serialisable arguments,
runs the thesis algorithm, and returns a dict matching the TypeScript
TrialOutcome shape.
"""

from __future__ import annotations

from typing import Any

from pyengine.tsplib import build_distance_matrix
from pyengine.algorithms import run_trial as _run_trial


def run_trial(
    algo: str,
    coords: list[list[float]],
    seed: int,
    theta: float,
    tau_pdr: float,
    t_max: int = 500,
    m: int = 30,
    alpha: float = 1.0,
    beta: float = 5.0,
    rho: float = 0.5,
    Q: float = 1.0,
    greedy_boost: float = 10.0,
    include_state: bool = True,
) -> dict[str, Any]:
    """Run one trial of one algorithm and return results as a dict.

    Parameters match what the frontend sends via Tauri IPC. The distance
    matrix is built from coords so the full Python pipeline runs standalone.
    When include_state is False, tour snapshots are omitted to keep the
    payload small for background batch trials.

    Returns a dict with:
        algo, seed, best_dist, convergence_iter, n_activations,
        time_s, best_history, entropy_history, pdr_history,
        triggered_history, best_tour_final, tour_frames, tour_snapshots,
        entropy_at_trigger, pdr_at_trigger
    """
    from pyengine import config as cfg

    # Build distance matrix from coordinates
    d = build_distance_matrix(coords)

    # Override config constants for this run
    original_t_max = cfg.T_MAX
    original_m = cfg.M
    original_alpha = cfg.ALPHA
    original_beta = cfg.BETA
    original_rho = cfg.RHO
    original_q = cfg.Q
    original_greedy_boost = cfg.GREEDY_BOOST

    cfg.T_MAX = t_max
    cfg.M = m
    cfg.ALPHA = alpha
    cfg.BETA = beta
    cfg.RHO = rho
    cfg.Q = Q
    cfg.GREEDY_BOOST = greedy_boost

    try:
        result = _run_trial(algo, d, seed, theta, tau_pdr, entropy_trace=True,
                            include_state=include_state)
    finally:
        # Restore original config
        cfg.T_MAX = original_t_max
        cfg.M = original_m
        cfg.ALPHA = original_alpha
        cfg.BETA = original_beta
        cfg.RHO = original_rho
        cfg.Q = original_q
        cfg.GREEDY_BOOST = original_greedy_boost

    return {
        "algo": result.algo,
        "seed": result.seed,
        "best_dist": result.best_dist,
        "convergence_iter": result.convergence_iter,
        "n_activations": result.n_activations,
        "time_s": result.time_s,
        "best_history": result.best_history,
        "entropy_history": result.entropy_history,
        "pdr_history": result.pdr_history,
        "triggered_history": result.triggered_history,
        "best_tour_final": result.best_tour_final,
        "tour_frames": result.tour_frames,
        "tour_snapshots": result.tour_snapshots,
        "entropy_at_trigger": result.entropy_at_trigger,
        "pdr_at_trigger": result.pdr_at_trigger,
    }
