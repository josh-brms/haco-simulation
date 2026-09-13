"""aco.py
========
Core Ant Colony Optimization building blocks shared by all three algorithm
configurations:

* ``initial_tau``            - uniform (1/(n * L_nn)) or greedy-seeded pheromone
* ``construct_tours``        - vectorised stochastic tour construction (AS rule)
* ``tour_lengths``           - vectorised tour-length evaluation
* ``update_pheromones``      - evaporation + Q/L_k reinforcement
"""

from __future__ import annotations

import numpy as np

from pyengine import config as cfg


def initial_tau(n: int, d: np.ndarray, seed: np.ndarray | None = None) -> np.ndarray:
    """Uniform pheromone matrix tau_0 = 1/(n * L_nn).

    If ``seed`` is a nearest-neighbour tour, the edges of that tour receive a
    greedy boost (used by the proposed adaptive HACO).
    """
    from pyengine.tsplib import nearest_neighbor_tour

    nn_tour, nn_len = nearest_neighbor_tour(d)
    tau = np.full((n, n), 1.0 / (n * nn_len))
    np.fill_diagonal(tau, 0.0)
    if seed is not None:
        edges = np.stack([seed[:-1], seed[1:]], axis=1)
        edges = np.concatenate([edges, [[seed[-1], seed[0]]]])
        for i, j in edges:
            tau[i, j] = tau[j, i] = tau[i, j] * cfg.GREEDY_BOOST
    return tau


def _effective(d: np.ndarray, tau: np.ndarray) -> np.ndarray:
    """tau^alpha * eta^beta, with eta = 1/d on every allowed edge."""
    n = d.shape[0]
    eta = np.divide(1.0, d, out=np.zeros_like(d), where=d > 0)
    return np.power(tau, cfg.ALPHA) * np.power(eta, cfg.BETA)


def construct_tours(
    d: np.ndarray,
    tau: np.ndarray,
    n_ants: int,
    rng: np.random.Generator,
) -> np.ndarray:
    """Vectorised construction of ``n_ants`` tours using the AS transition rule.

    Returns an (n_ants, n) array of node sequences.
    """
    n = d.shape[0]
    eff = _effective(d, tau)
    eff = np.where(eff > 0, eff, 0.0)

    tours = np.empty((n_ants, n), dtype=np.int64)
    starts = rng.integers(0, n, size=n_ants)
    tours[:, 0] = starts

    remaining = np.ones((n_ants, n), dtype=bool)
    remaining[np.arange(n_ants), starts] = False

    for step in range(1, n):
        probs = eff[tours[:, step - 1]] * remaining
        row_sum = probs.sum(axis=1, keepdims=True)
        probs = probs / np.where(row_sum > 0, row_sum, 1.0)
        cum = np.cumsum(probs, axis=1)
        r = rng.random(n_ants)[:, None]
        choice = np.argmax(cum >= r, axis=1)
        tours[:, step] = choice
        remaining[np.arange(n_ants), choice] = False

    return tours


def tour_lengths(d: np.ndarray, tours: np.ndarray) -> np.ndarray:
    """Vectorised total Euclidean length of every tour."""
    if tours.ndim == 1:
        tours = tours[None, :]
    fwd = d[tours[:, :-1], tours[:, 1:]].sum(axis=1)
    close = d[tours[:, -1], tours[:, 0]]
    return fwd + close


def update_pheromones(tau: np.ndarray, d: np.ndarray, tours: np.ndarray) -> np.ndarray:
    """Evaporation + reinforcement:  tau <- (1-rho) tau + sum_k Q/L_k."""
    n = d.shape[0]
    tau = (1.0 - cfg.RHO) * tau
    lens = tour_lengths(d, tours)
    deposit = np.zeros((n, n))
    n_ants = tours.shape[0]
    fwd_i = tours[:, :-1].ravel()
    fwd_j = tours[:, 1:].ravel()
    close_i = tours[:, -1].ravel()
    close_j = tours[:, 0].ravel()
    reps = np.concatenate([fwd_i, close_i])
    cols = np.concatenate([fwd_j, close_j])
    vals = np.concatenate([cfg.Q / lens.repeat(n - 1), cfg.Q / lens])
    np.add.at(deposit, (reps, cols), vals)
    return tau + deposit


def greedy_init_seed(d: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Nearest-neighbour seed tour used for greedy-seeded pheromone init."""
    from pyengine.tsplib import nearest_neighbor_tour

    tour, _ = nearest_neighbor_tour(d, rng)
    return tour
