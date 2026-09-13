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
    let pyengine_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.join("pyengine")))
        .unwrap_or_else(|| {
            // Fallback for development: resolve relative to Cargo.toml
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("pyengine")
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
    let pydir = pyengine_dir;

    tauri::async_runtime::spawn_blocking(move || {
        pybridge::run_trial(
            &pydir,
            &input_clone.algo,
            &input_clone.coords,
            input_clone.seed,
            input_clone.theta,
            input_clone.tau_pdr,
            &params,
        )
    })
    .await
    .map_err(|e| format!("task join error: {e}"))?
}
