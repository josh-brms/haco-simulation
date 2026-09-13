"""entropy_pdr.py
===============
Diversity-monitoring signals used by the proposed adaptive HACO trigger:

* Shannon information entropy H(S) of the edge distribution of the ant
  population, and
* Pheromone Dominance Ratio PDR(t) = tau_max / mean(tau over active edges).
"""

from __future__ import annotations

import numpy as np


def shannon_entropy(tours: np.ndarray, n: int) -> float:
    """H(S) = -sum_e p(e) log2 p(e), with p(e) = fraction of ants using edge e."""
    m = tours.shape[0]
    fwd_i = tours[:, :-1].ravel()
    fwd_j = tours[:, 1:].ravel()
    close_i = tours[:, -1].ravel()
    close_j = tours[:, 0].ravel()
    idx = np.concatenate([fwd_i * n + fwd_j, close_i * n + close_j])
    counts = np.bincount(idx, minlength=n * n)
    used = counts[counts > 0]
    p = used.astype(float) / m
    h = float(-(p * np.log2(p)).sum())
    return h


def pdr(tau: np.ndarray) -> float:
    """tau_max / mean(tau) over active (positive) pheromone edges."""
    active = tau[tau > 0.0]
    if active.size == 0:
        return 1.0
    return float(active.max() / active.mean())
