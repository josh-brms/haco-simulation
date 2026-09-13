"""two_opt.py
============
Vectorised 2-opt local search. Given a tour, repeatedly finds the best
improving 2-opt move (remove edges (i,i+1),(j,j+1); reconnect crosswise)
and reverses the segment until no improving move exists (2-opt optimal).
"""

from __future__ import annotations

import numpy as np


def two_opt(tour: np.ndarray, d: np.ndarray, max_passes: int = 500) -> np.ndarray:
    """Return a 2-opt locally optimal tour (best-improvement variant)."""
    n = d.shape[0]
    tour = np.asarray(tour).copy()
    for _ in range(max_passes):
        improved = False
        for i in range(n - 2):
            a = tour[i]
            b = tour[i + 1]
            j_arr = np.arange(i + 2, n)
            if j_arr.size == 0:
                continue
            c = tour[j_arr]
            c_next = tour[(j_arr + 1) % n]
            d_current = d[a, b] + d[c, c_next]
            d_cross = d[a, c] + d[b, c_next]
            gain = d_current - d_cross
            best_k = int(np.argmax(gain))
            if gain[best_k] > 1e-12:
                j = int(j_arr[best_k])
                tour[i + 1:j + 1] = tour[i + 1:j + 1][::-1]
                improved = True
                break
        if not improved:
            break
    return tour


def tour_dist(d: np.ndarray, tour: np.ndarray) -> float:
    """Total length of a tour (closing edge included)."""
    n = d.shape[0]
    return float(d[tour[:-1], tour[1:]].sum() + d[tour[-1], tour[0]])
