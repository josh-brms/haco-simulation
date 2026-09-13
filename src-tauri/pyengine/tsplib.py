"""tsplib.py
===========
TSPLIB utilities for the benchmark engine. Coordinates are received from the
frontend (no download needed). Provides nearest-neighbour tour construction
and distance matrix building.
"""

from __future__ import annotations

import math

import numpy as np


def build_distance_matrix(coords: list[tuple[float, float]]) -> np.ndarray:
    """Build a dense Euclidean distance matrix from a list of (x, y) pairs."""
    arr = np.asarray(coords, dtype=float)
    n = arr.shape[0]
    diff = arr[:, None, :] - arr[None, :, :]
    return np.sqrt((diff ** 2).sum(axis=2))


def nearest_neighbor_tour(d: np.ndarray, rng: np.random.Generator | None = None) -> tuple[np.ndarray, float]:
    """Construct a nearest-neighbour tour starting from a random city."""
    n = d.shape[0]
    rng = rng or np.random.default_rng(0)
    start = int(rng.integers(0, n))
    tour = np.empty(n, dtype=int)
    tour[0] = start
    visited = {start}
    for k in range(1, n):
        prev = tour[k - 1]
        best = None
        best_d = math.inf
        row = d[prev]
        for j in range(n):
            if j not in visited and row[j] < best_d:
                best_d = row[j]
                best = j
        tour[k] = best
        visited.add(best)
    length = float(
        d[tour[:-1], tour[1:]].sum() + d[tour[-1], tour[0]]
    )
    return tour, length
