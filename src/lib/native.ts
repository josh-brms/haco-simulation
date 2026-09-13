/**
 * Native bridge for the Tauri desktop shell.
 *
 * This application is desktop-only. All functions invoke Tauri IPC commands
 * directly. The isTauri() guard is kept as a safety check for development
 * scenarios where the frontend might accidentally load outside the webview.
 */
import { invoke } from "@tauri-apps/api/core";
import type { InstanceName } from "@/sim/instances";
import { INSTANCES } from "@/sim/instances";

/** Safety check -- should always be true in the desktop app. */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Write a report file via the native OS filesystem.
 * Requires the Tauri desktop shell.
 */
export async function saveReport(content: string, filename: string, _mime: string): Promise<void> {
  if (!isTauri()) {
    throw new Error("saveReport requires the Tauri desktop app");
  }
  const blob = new Blob([content], { type: _mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Fetch engine metadata from the Rust backend. */
export async function engineInfo(): Promise<unknown | null> {
  try {
    return await invoke("engine_info");
  } catch {
    return null;
  }
}

/** Result shape from the Python engine (matches TrialOutcome). */
export interface PythonTrialResult {
  algo: string;
  seed: number;
  best_dist: number;
  convergence_iter: number;
  n_activations: number;
  time_s: number;
  best_history: number[];
  entropy_history: number[];
  entropy_at_trigger: number[];
  pdr_at_trigger: number[];
  pdr_history: number[];
  triggered_history: boolean[];
}

interface PythonTrialInput {
  algo: string;
  coords: [number, number][];
  seed: number;
  theta: number;
  tau_pdr: number;
  t_max: number;
  m: number;
  alpha: number;
  beta: number;
  rho: number;
  q: number;
  greedy_boost: number;
}

/**
 * Run all three algorithms for one trial via the Python engine.
 * Returns results indexed 0 = standard_aco, 1 = nonadaptive_haco, 2 = adaptive_haco.
 */
export async function runPythonTrial(
  instanceName: InstanceName,
  seed: number,
  params: {
    tMax: number;
    ants: number;
    alpha: number;
    beta: number;
    rho: number;
    Q: number;
    greedyBoost: number;
  }
): Promise<PythonTrialResult[]> {
  const instance = INSTANCES[instanceName];
  const coords = instance.coords;

  const algos = ["standard_aco", "nonadaptive_haco", "adaptive_haco"];
  const results = await Promise.all(
    algos.map((algo) =>
      invoke<PythonTrialResult>("run_python_trial", {
        input: {
          algo,
          coords,
          seed,
          theta: instance.entropyTheta,
          tau_pdr: instance.pdrThreshold,
          t_max: params.tMax,
          m: params.ants,
          alpha: params.alpha,
          beta: params.beta,
          rho: params.rho,
          q: params.Q,
          greedy_boost: params.greedyBoost,
        } satisfies PythonTrialInput,
      })
    )
  );
  return results;
}
