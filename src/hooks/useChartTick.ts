import { useEffect, useState } from "react";

/**
 * Ticks at a fixed low frequency (default 5 Hz). Live simulation data
 * mutates in place, so charts subscribe to this tick instead of re-deriving
 * merged series on every animation frame (30 Hz), cutting re-render load
 * by ~6x without any visible difference for line charts.
 */
export function useChartTick(hz = 5): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), Math.round(1000 / hz));
    return () => clearInterval(id);
  }, [hz]);
  return tick;
}
