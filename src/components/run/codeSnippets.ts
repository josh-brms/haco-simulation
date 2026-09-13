/**
 * Embedded source snippets shown in the code panel. They are condensed from
 * the thesis implementation (thesiscode/algorithms.py) so the UI explains
 * the exact algorithm conditions being compared.
 */

export const STANDARD_ACO_CODE = `# Standard ACO - no local search (algorithms.py: run_standard_aco)
import numpy as np

from aco import construct_tours, initial_tau, tour_lengths, update_pheromones
from config import M, T_MAX
from entropy_pdr import shannon_entropy

def run_standard_aco(d, seed):
    n = d.shape[0]
    rng = np.random.default_rng(seed)
    tau = initial_tau(n, d)              # tau0 = 1 / (n * L_nn)
    best_tour = None
    best_len = float("inf")
    hist = np.empty(T_MAX)
    enth = np.empty(T_MAX)

    for t in range(T_MAX):
        # 1. construct m tours with the AS transition rule
        tours = construct_tours(d, tau, M, rng)
        lens = tour_lengths(d, tours)

        # 2. keep the iteration best if it beats the global best
        k = int(np.argmin(lens))
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()

        # 3. evaporation + Q / L_k reinforcement
        tau = update_pheromones(tau, d, tours)

        hist[t] = best_len
        enth[t] = shannon_entropy(tours, n)   # diversity trace

    return best_len, best_tour, hist, enth`;

export const NONADAPTIVE_HACO_CODE = `# Non-adaptive HACO - 2-opt every iteration (algorithms.py: _run_nonadaptive)
import numpy as np

from aco import construct_tours, initial_tau, tour_lengths, update_pheromones
from config import M, T_MAX
from entropy_pdr import shannon_entropy
from two_opt import tour_dist, two_opt

def _run_nonadaptive(d, seed):
    n = d.shape[0]
    rng = np.random.default_rng(seed)
    tau = initial_tau(n, d)              # uniform init, no greedy seed
    best_tour = None
    best_len = float("inf")
    hist = np.empty(T_MAX)
    enth = np.empty(T_MAX)

    for t in range(T_MAX):
        tours = construct_tours(d, tau, M, rng)
        lens = tour_lengths(d, tours)
        k = int(np.argmin(lens))
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()
        tau = update_pheromones(tau, d, tours)

        # unconditional O(n^2) refinement - every single iteration
        best_tour = two_opt(best_tour, d)
        best_len = tour_dist(d, best_tour)

        hist[t] = best_len
        enth[t] = shannon_entropy(tours, n)

    return best_len, best_tour, hist, enth`;

export const ADAPTIVE_HACO_CODE = `# Proposed Adaptive HACO - entropy-triggered 2-opt (algorithms.py: _run_adaptive)
import numpy as np

from aco import construct_tours, greedy_init_seed, initial_tau, tour_lengths, update_pheromones
from config import M, T_MAX
from entropy_pdr import pdr, shannon_entropy
from tsplib import nearest_neighbor_tour
from two_opt import tour_dist, two_opt

def _run_adaptive(d, seed, theta, tau_pdr):
    n = d.shape[0]
    rng = np.random.default_rng(seed)

    # greedy-seeded initialization: NN tour + boosted pheromone edges
    tau = initial_tau(n, d, seed=greedy_init_seed(d, rng))
    best_tour, best_len = nearest_neighbor_tour(d, rng)
    hist = np.empty(T_MAX)
    enth = np.empty(T_MAX)
    n_act = 0

    for t in range(T_MAX):
        tours = construct_tours(d, tau, M, rng)
        lens = tour_lengths(d, tours)
        k = int(np.argmin(lens))
        if lens[k] < best_len:
            best_len = float(lens[k])
            best_tour = tours[k].copy()
        tau = update_pheromones(tau, d, tours)

        # dual-signal stagnation detection
        H = shannon_entropy(tours, n)   # diversity  (low = stagnating)
        P = pdr(tau)                    # dominance  (high = over-exploiting)

        # trigger 2-opt ONLY when both signals fire
        if H < theta and P > tau_pdr:
            best_tour = two_opt(best_tour, d)
            best_len = tour_dist(d, best_tour)
            n_act += 1

        hist[t] = best_len
        enth[t] = H

    return best_len, best_tour, hist, n_act`;

export const CODE_FILES: Record<string, { label: string; code: string }> = {
  standard_aco: { label: "Standard ACO", code: STANDARD_ACO_CODE },
  nonadaptive_haco: { label: "Non-adaptive HACO", code: NONADAPTIVE_HACO_CODE },
  adaptive_haco: { label: "Proposed Adaptive HACO", code: ADAPTIVE_HACO_CODE },
};

/** Phase -> highlighted line range (1-based, inclusive) per algorithm file. */
export const PHASE_LINES: Record<string, Record<string, [number, number]>> = {
  standard_aco: {
    init: [10, 14],
    construct: [18, 20],
    update: [28, 31],
    signals: [32, 32],
  },
  nonadaptive_haco: {
    init: [12, 16],
    construct: [19, 21],
    update: [25, 25],
    twoopt: [28, 29],
    signals: [32, 32],
  },
  adaptive_haco: {
    init: [14, 19],
    construct: [22, 24],
    update: [28, 28],
    signals: [31, 32],
    trigger: [35, 38],
  },
};
