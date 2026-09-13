//! PyO3 bridge — embeds the Python ACO engine inside the Tauri backend.
//!
//! Python is initialized lazily on the first call and kept alive for the
//! lifetime of the process.  The `pyengine` package is imported from the
//! `src-tauri/pyengine/` directory, which is added to `sys.path` at init time.

use pyo3::prelude::*;
use pyo3::types::PyDict;
use serde::Serialize;

use std::sync::Once;

static INIT: Once = Once::new();

/// Parameters shared by all three algorithm configurations.
#[derive(Debug, Clone)]
pub struct TrialParams {
    pub t_max: u32,
    pub m: u32,
    pub alpha: f64,
    pub beta: f64,
    pub rho: f64,
    pub q: f64,
    pub greedy_boost: f64,
}

/// One sparse best-tour snapshot: [frame, tour...].
#[derive(Debug, Serialize)]
pub struct TourSnapshot {
    pub frame: i64,
    pub tour: Vec<i32>,
}

/// Result returned by the Python engine, matching the TypeScript TrialOutcome.
#[derive(Debug, Serialize)]
pub struct PythonTrialResult {
    pub algo: String,
    pub seed: u64,
    pub best_dist: f64,
    pub convergence_iter: u32,
    pub n_activations: u32,
    pub time_s: f64,
    pub best_history: Vec<f64>,
    pub entropy_history: Vec<f64>,
    pub entropy_at_trigger: Vec<f64>,
    pub pdr_at_trigger: Vec<f64>,
    pub pdr_history: Vec<f64>,
    pub triggered_history: Vec<bool>,
    pub best_tour_final: Vec<i32>,
    pub tour_improvements: Vec<TourSnapshot>,
}

/// Ensure the Python interpreter and the pyengine module are ready.
/// Safe to call multiple times; the `Once` guard prevents double-init.
fn ensure_python(pyengine_dir: &std::path::Path) -> PyResult<()> {
    INIT.call_once(|| {
        pyo3::prepare_freethreaded_python();
    });

    Python::with_gil(|py| -> PyResult<()> {
        let sys = py.import("sys")?;
        let path = sys.getattr("path")?;
        let dir_str = pyengine_dir.to_string_lossy().into_owned();
        let already: bool = path
            .call_method1("count", (dir_str.as_str(),))
            .and_then(|v| v.extract())
            .unwrap_or(0)
            > 0;
        if !already {
            path.call_method1("insert", (0, dir_str))?;
        }
        Ok(())
    })
}

/// Run one trial of one algorithm via the Python engine.
///
/// # Arguments
/// * `algo` - One of "standard_aco", "nonadaptive_haco", "adaptive_haco"
/// * `coords` - City coordinates as `[(x, y), ...]`
/// * `seed` - PRNG seed
/// * `theta` - Entropy stagnation threshold
/// * `tau_pdr` - Pheromone dominance threshold
/// * `params` - Shared benchmark parameters
pub fn run_trial(
    pyengine_dir: &std::path::Path,
    algo: &str,
    coords: &[(f64, f64)],
    seed: u64,
    theta: f64,
    tau_pdr: f64,
    params: &TrialParams,
    include_state: bool,
) -> Result<PythonTrialResult, String> {
    ensure_python(pyengine_dir).map_err(|e| format!("python init failed: {e}"))?;

    Python::with_gil(|py| -> Result<PythonTrialResult, String> {
        let pyengine = py.import("pyengine").map_err(|e| format!("import pyengine: {e}"))?;

        let coords_py: Vec<Vec<f64>> = coords.iter().map(|(x, y)| vec![*x, *y]).collect();

        let kwargs = PyDict::new(py);
        kwargs.set_item("algo", algo).map_err(|e| e.to_string())?;
        kwargs
            .set_item("coords", coords_py)
            .map_err(|e| e.to_string())?;
        kwargs.set_item("seed", seed).map_err(|e| e.to_string())?;
        kwargs.set_item("theta", theta).map_err(|e| e.to_string())?;
        kwargs
            .set_item("tau_pdr", tau_pdr)
            .map_err(|e| e.to_string())?;
        kwargs
            .set_item("t_max", params.t_max)
            .map_err(|e| e.to_string())?;
        kwargs.set_item("m", params.m).map_err(|e| e.to_string())?;
        kwargs
            .set_item("alpha", params.alpha)
            .map_err(|e| e.to_string())?;
        kwargs
            .set_item("beta", params.beta)
            .map_err(|e| e.to_string())?;
        kwargs
            .set_item("rho", params.rho)
            .map_err(|e| e.to_string())?;
        kwargs.set_item("Q", params.q).map_err(|e| e.to_string())?;
        kwargs
            .set_item("greedy_boost", params.greedy_boost)
            .map_err(|e| e.to_string())?;
        kwargs
            .set_item("include_state", include_state)
            .map_err(|e| e.to_string())?;

        let result = pyengine
            .call_method("run_trial", (), Some(&kwargs))
            .map_err(|e| {
                let tb = py.import("traceback").ok();
                let msg = if let Some(tb) = tb {
                    tb.call_method1("format_exc", ())
                        .and_then(|v| v.extract::<String>())
                        .unwrap_or_else(|_| e.to_string())
                } else {
                    e.to_string()
                };
                format!("pyengine.run_trial failed: {msg}")
            })?;

        let best_history: Vec<f64> = result
            .getattr("best_history")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract best_history: {e}"))?;
        let entropy_history: Vec<f64> = result
            .getattr("entropy_history")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract entropy_history: {e}"))?;
        let entropy_at_trigger: Vec<f64> = result
            .getattr("entropy_at_trigger")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract entropy_at_trigger: {e}"))?;
        let pdr_at_trigger: Vec<f64> = result
            .getattr("pdr_at_trigger")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract pdr_at_trigger: {e}"))?;
        let pdr_history: Vec<f64> = result
            .getattr("pdr_history")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract pdr_history: {e}"))?;
        let triggered_history: Vec<bool> = result
            .getattr("triggered_history")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract triggered_history: {e}"))?;
        let best_tour_final: Vec<i32> = result
            .getattr("best_tour_final")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract best_tour_final: {e}"))?;
        let tour_frames: Vec<i64> = result
            .getattr("tour_frames")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract tour_frames: {e}"))?;
        let tour_snapshots: Vec<Vec<i32>> = result
            .getattr("tour_snapshots")
            .and_then(|v| v.extract())
            .map_err(|e| format!("extract tour_snapshots: {e}"))?;
        if tour_frames.len() != tour_snapshots.len() {
            return Err(format!(
                "tour_frames/tour_snapshots length mismatch: {} vs {}",
                tour_frames.len(),
                tour_snapshots.len()
            ));
        }
        let tour_improvements = tour_frames
            .into_iter()
            .zip(tour_snapshots)
            .map(|(frame, tour)| TourSnapshot { frame, tour })
            .collect::<Vec<_>>();

        Ok(PythonTrialResult {
            algo: result
                .getattr("algo")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract algo: {e}"))?,
            seed: result
                .getattr("seed")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract seed: {e}"))?,
            best_dist: result
                .getattr("best_dist")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract best_dist: {e}"))?,
            convergence_iter: result
                .getattr("convergence_iter")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract convergence_iter: {e}"))?,
            n_activations: result
                .getattr("n_activations")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract n_activations: {e}"))?,
            time_s: result
                .getattr("time_s")
                .and_then(|v| v.extract())
                .map_err(|e| format!("extract time_s: {e}"))?,
            best_history,
            entropy_history,
            entropy_at_trigger,
            pdr_at_trigger,
            pdr_history,
            triggered_history,
            best_tour_final,
            tour_improvements,
        })
    })
}
