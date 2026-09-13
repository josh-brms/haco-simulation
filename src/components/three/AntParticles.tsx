import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export interface AntParticlesProps {
  tour: Int32Array | null;
  points: Float32Array;
  count: number;
  color: string;
  speed: number;
  active: boolean;
}

/**
 * Particle ants walking the closed best tour. A single InstancedMesh with a
 * persistent dummy object; segment lengths are recomputed per frame (O(n),
 * cheap) so the ants flow smoothly even while the tour mutates underneath
 * them. No per-frame allocations beyond the instance matrix writes.
 */
export default function AntParticles({
  tour,
  points,
  count,
  color,
  speed,
  active,
}: AntParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const progress = useRef(0);
  const segLens = useMemo(() => new Float64Array(tour ? tour.length : 0), [tour?.length]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || !tour || tour.length === 0) return;
    const n = tour.length;

    // segment lengths of the closed tour (O(n) per frame)
    let total = 0;
    for (let k = 0; k < n; k++) {
      const a = tour[k];
      const b = tour[(k + 1) % n];
      const dx = points[b * 3] - points[a * 3];
      const dy = points[b * 3 + 1] - points[a * 3 + 1];
      const dz = points[b * 3 + 2] - points[a * 3 + 2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      segLens[k] = len;
      total += len;
    }
    if (total <= 0) return;

    if (active) progress.current = (progress.current + delta * speed) % 1;
    void speed;

    for (let a = 0; a < count; a++) {
      const t = (progress.current + a / count) % 1;
      const target = t * total;

      // walk segments to the target arc position
      let acc = 0;
      let seg = 0;
      for (let k = 0; k < n; k++) {
        if (acc + segLens[k] > target) {
          seg = k;
          break;
        }
        acc += segLens[k];
        seg = k;
      }
      const segLen = segLens[seg];
      const local = segLen > 0 ? (target - acc) / segLen : 0;
      const i0 = tour[seg];
      const i1 = tour[(seg + 1) % n];

      const x = points[i0 * 3] + (points[i1 * 3] - points[i0 * 3]) * local;
      const y = points[i0 * 3 + 1] + (points[i1 * 3 + 1] - points[i0 * 3 + 1]) * local;
      const z = points[i0 * 3 + 2] + (points[i1 * 3 + 2] - points[i0 * 3 + 2]) * local;

      dummy.position.set(x, y, z + Math.sin(local * Math.PI) * 0.6);
      dummy.scale.setScalar(0.55 + 0.25 * Math.sin(t * Math.PI * 6 + a));
      dummy.updateMatrix();
      mesh.setMatrixAt(a, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!tour || tour.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </instancedMesh>
  );
}
