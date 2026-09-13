import type { EdgeWeights } from "@/sim/engine";

export interface TrailEdge {
  i: number;
  j: number;
  w: number;
}

/** Convert the engine's compact edge arrays into the list Map3D renders. */
export function toTrailEdges(ew: EdgeWeights, nodeCount: number): TrailEdge[] {
  const out: TrailEdge[] = [];
  for (let k = 0; k < ew.count; k++) {
    const i = ew.i[k];
    const j = ew.j[k];
    if (i < nodeCount && j < nodeCount) out.push({ i, j, w: ew.w[k] });
  }
  return out;
}

export const EMPTY_TRAIL_EDGES: TrailEdge[] = [];
