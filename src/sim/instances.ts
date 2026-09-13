import eil51 from "./data/eil51.json";
import berlin52 from "./data/berlin52.json";
import eil76 from "./data/eil76.json";
import kroA100 from "./data/kroA100.json";
import kroB150 from "./data/kroB150.json";
import kroA200 from "./data/kroA200.json";

export type InstanceName = "eil51" | "berlin52" | "eil76" | "kroA100" | "kroB150" | "kroA200";

export interface TspInstance {
  name: InstanceName;
  nodes: number;
  /** Known optimal tour length from the literature. */
  optimum: number;
  /** Calibrated entropy stagnation threshold theta (thesis calibration runs, 30th percentile of H(S)). */
  entropyTheta: number;
  /** Calibrated pheromone dominance threshold tau_PDR. */
  pdrThreshold: number;
  /** City coordinates [x, y] as published in TSPLIB. */
  coords: [number, number][];
}

export const INSTANCES: Record<InstanceName, TspInstance> = {
  eil51: eil51 as TspInstance,
  berlin52: berlin52 as TspInstance,
  eil76: eil76 as TspInstance,
  kroA100: kroA100 as TspInstance,
  kroB150: kroB150 as TspInstance,
  kroA200: kroA200 as TspInstance,
};

export const INSTANCE_NAMES = Object.keys(INSTANCES) as InstanceName[];
