//! BenchmarkThesis - Tauri desktop shell.
//!
//! The simulation core is the TypeScript engine bundled in the frontend
//! (src/sim/*) so the benchmark runs entirely in the webview with zero IPC
//! latency for real-time visualization. This shell provides native windowing
//! plus a small Python bridge (pyo3) reserved for heavy off-thread jobs.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod pybridge;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::engine_info,
            commands::export_report,
            commands::run_python_trial,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
