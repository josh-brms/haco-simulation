"""config.py
==========
Shared benchmark parameters (hardcoded from thesis params.json).
"""

from __future__ import annotations

INSTANCES: list[str] = [
    "eil51", "berlin52", "eil76", "kroA100", "kroB150", "kroA200",
]
TRIALS: int = 30
T_MAX: int = 500
M: int = 30
ALPHA: float = 1.0
BETA: float = 5.0
RHO: float = 0.5
Q: float = 1.0
SEED_BASE: int = 0
EPSILON: float = 0.001
WINDOW: int = 20
PDR_THRESHOLD: float = 2.0
ENTROPY_QUANTILE: float = 0.30
GREEDY_BOOST: float = 10.0
OPTIMA: dict[str, float] = {
    "eil51": 426.0,
    "berlin52": 7542.0,
    "eil76": 538.0,
    "kroA100": 21282.0,
    "kroB150": 26130.0,
    "kroA200": 29368.0,
}

ALGORITHMS = ["standard_aco", "nonadaptive_haco", "adaptive_haco"]

ALGO_LABELS = {
    "standard_aco": "Standard ACO",
    "nonadaptive_haco": "Non-adaptive HACO",
    "adaptive_haco": "Proposed Adaptive HACO",
}
