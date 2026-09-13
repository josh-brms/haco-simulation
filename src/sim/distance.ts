/**
 * Problem geometry: dense Euclidean distance matrix (tsplib.load).
 * Stored row-major in a flat Float64Array for cache-friendly access.
 */

export type DistanceMatrix = Float64Array;

export function distanceMatrix(coords: [number, number][]): DistanceMatrix {
  const n = coords.length;
  const d = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = coords[i][0] - coords[j][0];
      const dy = coords[i][1] - coords[j][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      d[i * n + j] = dist;
      d[j * n + i] = dist;
    }
  }
  return d;
}
