//! Tauri IPC commands.
//!
//! The heavy lifting (ACO simulation, charts, exports) lives in the TS engine
//! inside the webview. These commands expose native capabilities: app info,
//! report export through the OS file dialog, and a Python engine bridge.

use serde::{Deserialize, Serialize};

use crate::pybridge::{self, PythonTrialResult, TrialParams};

#[derive(Serialize)]
pub struct EngineInfo {
    pub name: String,
    pub version: String,
    pub algorithms: Vec<String>,
    pub instances: Vec<String>,
}

#[derive(Deserialize)]
pub struct RunPythonTrialInput {
    pub algo: String,
    pub coords: Vec<(f64, f64)>,
    pub seed: u64,
    pub theta: f64,
    pub tau_pdr: f64,
    pub t_max: u32,
    pub m: u32,
    pub alpha: f64,
    pub beta: f64,
    pub rho: f64,
    pub q: f64,
    pub greedy_boost: f64,
    #[serde(default = "default_include_state")]
    pub include_state: bool,
}

fn default_include_state() -> bool {
    true
}

fn validate_trial_input(input: &RunPythonTrialInput) -> Result<(), String> {
    match input.algo.as_str() {
        "standard_aco" | "nonadaptive_haco" | "adaptive_haco" => {}
        other => return Err(format!("unknown algorithm: {other}")),
    }
    let n = input.coords.len();
    if !(4..=500).contains(&n) {
        return Err(format!("coords must hold 4..=500 cities, got {n}"));
    }
    for (i, (x, y)) in input.coords.iter().enumerate() {
        if !x.is_finite() || !y.is_finite() {
            return Err(format!("coords[{i}] must be finite numbers"));
        }
    }
    if !(1..=2000).contains(&input.t_max) {
        return Err(format!("t_max must be 1..=2000, got {}", input.t_max));
    }
    if !(5..=100).contains(&input.m) {
        return Err(format!("m must be 5..=100, got {}", input.m));
    }
    if !(0.0..=10.0).contains(&input.alpha) || !input.alpha.is_finite() {
        return Err(format!("alpha must be 0..=10, got {}", input.alpha));
    }
    if !(0.0..=10.0).contains(&input.beta) || !input.beta.is_finite() {
        return Err(format!("beta must be 0..=10, got {}", input.beta));
    }
    if !(0.01..=0.99).contains(&input.rho) || !input.rho.is_finite() {
        return Err(format!("rho must be 0.01..=0.99, got {}", input.rho));
    }
    if !(0.01..=100.0).contains(&input.q) || !input.q.is_finite() {
        return Err(format!("q must be 0.01..=100, got {}", input.q));
    }
    if !(input.greedy_boost > 0.0) || !input.greedy_boost.is_finite() {
        return Err(format!(
            "greedy_boost must be positive, got {}",
            input.greedy_boost
        ));
    }
    if !input.theta.is_finite() || input.theta < 0.0 {
        return Err(format!("theta must be finite and >= 0, got {}", input.theta));
    }
    if !input.tau_pdr.is_finite() || input.tau_pdr < 0.0 {
        return Err(format!(
            "tau_pdr must be finite and >= 0, got {}",
            input.tau_pdr
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn ping() -> String {
    "pong".into()
}

#[tauri::command]
pub fn engine_info() -> EngineInfo {
    EngineInfo {
        name: "haco-adaptive-2opt".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        algorithms: vec![
            "standard_aco".into(),
            "nonadaptive_haco".into(),
            "adaptive_haco".into(),
        ],
        instances: vec![
            "eil51".into(),
            "berlin52".into(),
            "eil76".into(),
            "kroA100".into(),
            "kroB150".into(),
            "kroA200".into(),
        ],
    }
}

/// Export a report payload to a user-chosen file via the frontend.
/// The frontend generates MD/HTML content and passes it here together with a
/// path (from the dialog plugin) - we simply write bytes to disk natively so
/// exports work with real filesystem permissions inside the packaged app.
#[tauri::command]
pub fn export_report(path: String, content: String) -> Result<String, String> {
    std::fs::write(&path, content).map_err(|e| format!("failed to write {}: {e}", path))?;
    Ok(path)
}

/// Run one trial of the Python ACO engine via PyO3.
#[tauri::command]
pub async fn run_python_trial(input: RunPythonTrialInput) -> Result<PythonTrialResult, String> {
    validate_trial_input(&input)?;
    let pyengine_parent = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .filter(|p| p.join("pyengine").exists())
        .unwrap_or_else(|| {
            // Fallback for development: resolve to Cargo.toml directory (src-tauri)
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        });

    let params = TrialParams {
        t_max: input.t_max,
        m: input.m,
        alpha: input.alpha,
        beta: input.beta,
        rho: input.rho,
        q: input.q,
        greedy_boost: input.greedy_boost,
    };

    let input_clone = input;
    let pydir = pyengine_parent;

    tauri::async_runtime::spawn_blocking(move || {
        pybridge::run_trial(
            &pydir,
            &input_clone.algo,
            &input_clone.coords,
            input_clone.seed,
            input_clone.theta,
            input_clone.tau_pdr,
            &params,
            input_clone.include_state,
        )
    })
    .await
    .map_err(|e| format!("task join error: {e}"))?
}
