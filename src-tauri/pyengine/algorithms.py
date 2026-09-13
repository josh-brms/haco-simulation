"""algorithms.py
===============
The three algorithm configurations compared in the thesis:

1. Standard ACO ............... no local search
2. Non-adaptive HACO .......... 2-opt applied at every iteration
3. Proposed Adaptive HACO ..... 2-opt applied only when
                                H(S) < theta AND PDR(t) > tau_pdr
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

import numpy as np

from pyengine.aco import (
    construct_tours,
    greedy_init_seed,
    initial_tau,
    tour_lengths,
    update_pheromones,
)
from pyengine import config as cfg
from pyengine.entropy_pdr import pdr, shannon_entropy
from pyengine.two_opt import tour_dist, two_opt
from pyengine.tsplib import nearest_neighbor_tour


@dataclass
class TrialResult:
    algo: str
    instance: str
    seed: int
    time_s: float
    best_dist: float
    convergence_iter: int
    n: int = 0
    n_activations: int = 0
    swops: int = 0
    entropy_at_trigger: list[float] = field(default_factory=list)
    pdr_at_trigger: list[float] = field(default_factory=list)
    best_history: list[float] = field(default_factory=list)
    entropy_history: list[float] = field(default_factory=list)
    pdr_history: list[float] = field(default_factory=list)
    triggered_history: list[bool] = field(default_factory=list)
    best_tour_final: list[int] = field(default_factory=list)
    tour_improvements: list[list] = field(default_factory=list)


def _convergence_iter(best_history: np.ndarray) -> int:
    """First iteration t where improvement over the last W=20 iterations is
    <= eps (relative); T_MAX if never met."""
    n = best_history.size
    for t in range(cfg.WINDOW, n):
        prev = best_history[t - cfg.WINDOW]
        if prev > 0 and (prev - best_history[t]) / prev <= cfg.EPSILON:
            return int(t)
    return int(n)


def run_standard_aco(d: np.ndarray, seed: int, entropy_trace: bool = True,
                     pdr_theta: float | None = None,
                     include_state: bool = True) -> TrialResult:
    n = d.shape[0]
    rng = np.random.default_rng(seed)
    t0 = time.perf_counter()
    tau = initial_tau(n, d)
    best_tour = None
    best_len = float("inf")
    hist = np.empty(cfg.T_MAX)
    enth = np.empty(cfg.T_MAX)
    pdr_hist = np.empty(cfg.T_MAX)
    trig_hist = np.zeros(cfg.T_MAX, dtype=bool)
    improvements: list[list] = []
    for t in range(cfg.T_MAX):
        tours = construct_tours(d, tau, cfg.M, rng)
        lens = tour_lengths(d, tours)
        k = int(np.argmin(lens))
        improved = False
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()
            improved = True
        tau = update_pheromones(tau, d, tours)
        hist[t] = best_len
        pdr_hist[t] = pdr(tau)
        if entropy_trace:
            enth[t] = shannon_entropy(tours, n)
        if include_state and best_tour is not None and (improved or t % 5 == 0 or t == cfg.T_MAX - 1):
            improvements.append([t, best_tour.tolist()])
    elapsed = time.perf_counter() - t0
    return TrialResult(
        algo="standard_aco", instance="", seed=seed, time_s=elapsed,
        best_dist=best_len, convergence_iter=_convergence_iter(hist), n=n,
        best_history=hist.tolist(),
        entropy_history=enth.tolist() if entropy_trace else [],
        pdr_history=pdr_hist.tolist(),
        triggered_history=trig_hist.tolist(),
        best_tour_final=best_tour.tolist() if include_state and best_tour is not None else [],
        tour_improvements=improvements if include_state else [],
    )


def _run_nonadaptive(d: np.ndarray, seed: int, entropy_trace: bool = True,
                     include_state: bool = True) -> TrialResult:
    n = d.shape[0]
    rng = np.random.default_rng(seed)
    t0 = time.perf_counter()
    tau = initial_tau(n, d)
    best_tour = None
    best_len = float("inf")
    hist = np.empty(cfg.T_MAX)
    enth = np.empty(cfg.T_MAX)
    pdr_hist = np.empty(cfg.T_MAX)
    trig_hist = np.ones(cfg.T_MAX, dtype=bool)
    improvements: list[list] = []
    for t in range(cfg.T_MAX):
        tours = construct_tours(d, tau, cfg.M, rng)
        lens = tour_lengths(d, tours)
        k = int(np.argmin(lens))
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()
        tau = update_pheromones(tau, d, tours)
        best_tour = two_opt(best_tour, d)
        best_len = tour_dist(d, best_tour)
        hist[t] = best_len
        pdr_hist[t] = pdr(tau)
        if include_state and best_tour is not None and (t % 5 == 0 or t == cfg.T_MAX - 1):
            improvements.append([t, best_tour.tolist()])
        if entropy_trace:
            enth[t] = shannon_entropy(tours, n)
    elapsed = time.perf_counter() - t0
    return TrialResult(
        algo="nonadaptive_haco", instance="", seed=seed, time_s=elapsed,
        best_dist=best_len, convergence_iter=_convergence_iter(hist), n=n,
        best_history=hist.tolist(),
        entropy_history=enth.tolist() if entropy_trace else [],
        pdr_history=pdr_hist.tolist(),
        triggered_history=trig_hist.tolist(),
        best_tour_final=best_tour.tolist() if include_state and best_tour is not None else [],
        tour_improvements=improvements if include_state else [],
    )


def _run_adaptive(d: np.ndarray, seed: int, theta: float, tau_pdr: float,
                  entropy_trace: bool = True,
                  include_state: bool = True) -> TrialResult:
    n = d.shape[0]
    rng = np.random.default_rng(seed)
    t0 = time.perf_counter()
    tau = initial_tau(n, d, seed=greedy_init_seed(d, rng))
    best_tour, best_len = nearest_neighbor_tour(d, rng)
    hist = np.empty(cfg.T_MAX)
    enth = np.empty(cfg.T_MAX)
    pdr_hist = np.empty(cfg.T_MAX)
    trig_hist = np.zeros(cfg.T_MAX, dtype=bool)
    n_act = 0
    triggers_e = []
    triggers_p = []
    improvements: list[list] = []
    if include_state:
        improvements.append([-1, np.asarray(best_tour).tolist()])
    for t in range(cfg.T_MAX):
        tours = construct_tours(d, tau, cfg.M, rng)
        lens = tour_lengths(d, tours)
        k = int(np.argmin(lens))
        improved = False
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()
            improved = True
        tau = update_pheromones(tau, d, tours)
        hist[t] = best_len
        H = shannon_entropy(tours, n)
        P = pdr(tau)
        pdr_hist[t] = P
        if entropy_trace:
            enth[t] = H
        fired = False
        if H < theta and P > tau_pdr:
            best_tour = two_opt(best_tour, d)
            best_len = tour_dist(d, best_tour)
            hist[t] = best_len
            trig_hist[t] = True
            fired = True
            n_act += 1
            triggers_e.append(H)
            triggers_p.append(P)
        if include_state and (improved or fired or t % 5 == 0 or t == cfg.T_MAX - 1):
            improvements.append([t, np.asarray(best_tour).tolist()])
    elapsed = time.perf_counter() - t0
    return TrialResult(
        algo="adaptive_haco", instance="", seed=seed, time_s=elapsed,
        best_dist=best_len, convergence_iter=_convergence_iter(hist), n=n,
        n_activations=n_act, entropy_at_trigger=triggers_e,
        pdr_at_trigger=triggers_p, best_history=hist.tolist(),
        entropy_history=enth.tolist() if entropy_trace else [],
        pdr_history=pdr_hist.tolist(),
        triggered_history=trig_hist.tolist(),
        best_tour_final=np.asarray(best_tour).tolist() if include_state else [],
        tour_improvements=improvements if include_state else [],
    )


def run_trial(algo: str, d: np.ndarray, seed: int, theta: float,
              tau_pdr: float, entropy_trace: bool = False,
              include_state: bool = True) -> TrialResult:
    if algo == "standard_aco":
        return run_standard_aco(d, seed, entropy_trace, include_state=include_state)
    if algo == "nonadaptive_haco":
        return _run_nonadaptive(d, seed, entropy_trace, include_state=include_state)
    if algo == "adaptive_haco":
        return _run_adaptive(d, seed, theta, tau_pdr, entropy_trace, include_state=include_state)
    raise ValueError(f"unknown algorithm: {algo}")
