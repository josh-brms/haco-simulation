import { useMemo, useRef, useEffect, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AntParticles from "./AntParticles";

export interface TrailEdge {
  i: number;
  j: number;
  w: number;
}

export interface Map3DProps {
  coords: [number, number][];
  bestTour: Int32Array | null;
  trails: TrailEdge[];
  algoColor: string;
  antCount: number;
  antSpeed: number;
  antsActive: boolean;
  /** Increments each simulation iteration; drives in-place buffer updates. */
  version: number;
  flashFrame: number;
  heightExaggeration?: number;
}

const TRAIL_CAP = 400;
const TRAIL_LOW = new THREE.Color("#27272a");
const TRAIL_HIGH = new THREE.Color("#22c55e");

function normalizeCoords(coords: [number, number][]): Float32Array {
  const n = coords.length;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = 80 / Math.max(spanX, spanY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const points = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    points[i * 3] = (coords[i][0] - cx) * scale;
    points[i * 3 + 1] = (coords[i][1] - cy) * scale;
    points[i * 3 + 2] = 0;
  }
  return points;
}

/**
 * Pheromone trails. The BufferGeometry is allocated once (TRAIL_CAP
 * segments) and rewritten in place per version - no per-frame GPU
 * reallocation, no GC churn.
 */
function TrailLines({ edges, points, version }: { edges: TrailEdge[]; points: Float32Array; version: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_CAP * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL_CAP * 6), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = geometry.getAttribute("color") as THREE.BufferAttribute;
    const pa = pos.array as Float32Array;
    const ca = col.array as Float32Array;

    let wMax = 0;
    for (let k = 0; k < edges.length; k++) if (edges[k].w > wMax) wMax = edges[k].w;

    const count = Math.min(edges.length, TRAIL_CAP);
    const c = new THREE.Color();
    for (let k = 0; k < count; k++) {
      const { i, j, w } = edges[k];
      const o = k * 6;
      pa[o] = points[i * 3];
      pa[o + 1] = points[i * 3 + 1];
      pa[o + 2] = points[i * 3 + 2] + 0.05;
      pa[o + 3] = points[j * 3];
      pa[o + 4] = points[j * 3 + 1];
      pa[o + 5] = points[j * 3 + 2] + 0.05;

      const t01 = wMax > 0 ? Math.sqrt(w / wMax) : 0;
      c.copy(TRAIL_LOW).lerp(TRAIL_HIGH, t01);
      ca[o] = c.r;
      ca[o + 1] = c.g;
      ca[o + 2] = c.b;
      ca[o + 3] = c.r;
      ca[o + 4] = c.g;
      ca[o + 5] = c.b;
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geometry.setDrawRange(0, count * 2);
    geometry.computeBoundingSphere();
  }, [edges, points, version, geometry]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** Best tour line, updated in place per version. */
function TourLine({
  tour,
  points,
  color,
  version,
}: {
  tour: Int32Array | null;
  points: Float32Array;
  color: string;
  version: number;
}) {
  const nodeCount = points.length / 3;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodeCount * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, [nodeCount]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    if (!tour || tour.length === 0) {
      geometry.setDrawRange(0, 0);
      return;
    }
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const pa = pos.array as Float32Array;
    for (let k = 0; k < nodeCount; k++) {
      const idx = tour[k];
      pa[k * 3] = points[idx * 3];
      pa[k * 3 + 1] = points[idx * 3 + 1];
      pa[k * 3 + 2] = points[idx * 3 + 2] + 0.6;
    }
    pos.needsUpdate = true;
    geometry.setDrawRange(0, nodeCount);
    geometry.computeBoundingSphere();
  }, [tour, points, version, geometry, nodeCount]);

  return (
    <lineLoop geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color={color} transparent opacity={0.95} linewidth={2} />
    </lineLoop>
  );
}

function CityNodes({ points }: { points: Float32Array }) {
  const n = points.length / 3;
  const glowMat = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(points.slice(), 3));
    return g;
  }, [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const glowGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(points.slice(), 3));
    return g;
  }, [points]);
  useEffect(() => () => glowGeo.dispose(), [glowGeo]);

  // subtle breathing glow so the map always feels alive
  useFrame(({ clock }) => {
    const mat = glowMat.current;
    if (!mat) return;
    mat.opacity = 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2));
  });

  return (
    <group>
      <points geometry={geometry}>
        <pointsMaterial color="#a1a1aa" size={2.4} sizeAttenuation={false} />
      </points>
      <points geometry={glowGeo}>
        <pointsMaterial
          ref={glowMat}
          color="#22c55e"
          size={6}
          sizeAttenuation={false}
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <group>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[points[i * 3], points[i * 3 + 1], points[i * 3 + 2] + 0.15]}>
            <sphereGeometry args={[0.45, 10, 10]} />
            <meshBasicMaterial color="#e4e4e7" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function TriggerFlash({
  flashFrame,
  points,
  tour,
}: {
  flashFrame: number;
  points: Float32Array;
  tour: Int32Array | null;
}) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const mat1 = useRef<THREE.MeshBasicMaterial>(null);
  const mat2 = useRef<THREE.MeshBasicMaterial>(null);
  const life = useRef(0);
  const prevFlash = useRef(0);

  useEffect(() => {
    if (flashFrame > prevFlash.current) {
      life.current = 1;
      prevFlash.current = flashFrame;
    }
  }, [flashFrame]);

  useFrame((_, delta) => {
    const r1 = ring1.current;
    const r2 = ring2.current;
    const m1 = mat1.current;
    const m2 = mat2.current;
    if (!r1 || !r2 || !m1 || !m2) return;

    if (life.current > 0) {
      life.current = Math.max(0, life.current - delta * 1.4);

      // primary shockwave
      const t1 = 1 - life.current;
      const s1 = 2 + t1 * 14;
      r1.scale.set(s1, s1, s1);
      m1.opacity = life.current * 0.9;
      r1.visible = true;
      r1.rotation.z -= delta * 3;

      // secondary shockwave, delayed and wider
      const life2 = life.current - 0.18;
      if (life2 > 0) {
        const t2 = 1 - life2 / 0.82;
        const s2 = 2 + t2 * 20;
        r2.scale.set(s2, s2, s2);
        m2.opacity = life2 * 0.5;
        r2.visible = true;
        r2.rotation.z += delta * 1.8;
      } else {
        r2.visible = false;
      }
    } else {
      r1.visible = false;
      r2.visible = false;
    }
  });

  const pos = useMemo(() => {
    if (!tour || tour.length === 0) return [0, 0, 0.8] as const;
    const idx = tour[0];
    return [points[idx * 3], points[idx * 3 + 1], points[idx * 3 + 2] + 0.8] as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, flashFrame]);

  return (
    <group position={[pos[0], pos[1], pos[2]]}>
      <mesh ref={ring1} visible={false}>
        <ringGeometry args={[0.85, 1, 48]} />
        <meshBasicMaterial
          ref={mat1}
          color="#fbbf24"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring2} visible={false}>
        <ringGeometry args={[0.94, 1, 48]} />
        <meshBasicMaterial
          ref={mat2}
          color="#fbbf24"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Grid() {
  return (
    <group position={[0, 0, -2]}>
      <gridHelper args={[220, 22, "#27272a", "#18181b"]} />
    </group>
  );
}

/**
 * One-shot entrance: the scene swings in with an ease-out rotation, lift,
 * and scale when a new instance mounts. After ~1.1s it rests exactly at the
 * default pose and OrbitControls take over untouched.
 */
function SceneIntro({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || t.current >= 1) return;
    t.current = Math.min(1, t.current + delta / 1.1);
    const e = 1 - Math.pow(1 - t.current, 3); // easeOutCubic
    g.rotation.y = (1 - e) * -0.55;
    g.position.y = (1 - e) * -7;
    g.scale.setScalar(0.9 + 0.1 * e);
  });

  return <group ref={group}>{children}</group>;
}

export default function Map3D({
  coords,
  bestTour,
  trails,
  algoColor,
  antCount,
  antSpeed,
  antsActive,
  version,
  flashFrame,
}: Map3DProps) {
  const points = useMemo(() => normalizeCoords(coords), [coords]);

  return (
    <Canvas
      camera={{ position: [0, -90, 60], fov: 45, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      data-testid="map3d-canvas"
    >
      <color attach="background" args={["#0c0c0f"]} />
      <fog attach="fog" args={["#0c0c0f", 180, 420]} />

      <Grid />
      <SceneIntro>
        <CityNodes points={points} />
        <TrailLines edges={trails} points={points} version={version} />
        <TourLine tour={bestTour} points={points} color={algoColor} version={version} />
        <AntParticles
          tour={bestTour}
          points={points}
          count={antCount}
          color={algoColor}
          speed={antSpeed}
          active={antsActive}
        />
        <TriggerFlash flashFrame={flashFrame} points={points} tour={bestTour} />
      </SceneIntro>

      <OrbitControls
        enablePan
        enableZoom
        maxPolarAngle={Math.PI / 2.05}
        minDistance={30}
        maxDistance={300}
      />
    </Canvas>
  );
}
