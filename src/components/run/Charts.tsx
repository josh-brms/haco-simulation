import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import { ALGO_NAMES, ALGO_COLORS, type AlgoId } from "@/sim/engine";
import type { TspInstance } from "@/sim/instances";
import { fmt } from "@/lib/utils";

/** Live or archived per-algorithm series, indexed by iteration. */
export interface SeriesHistory {
  algo: AlgoId;
  best: number[];
  entropy: number[];
  dominance: number[];
  triggered: boolean[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e4e4e7",
};

/** Merge per-algorithm series into one row per iteration, downsampled. */
function mergeSeries(histories: SeriesHistory[], key: "best" | "entropy" | "dominance", maxPoints = 250) {
  const maxLen = Math.max(0, ...histories.map((h) => h[key].length));
  if (maxLen === 0) return [];

  const step = Math.max(1, Math.floor(maxLen / maxPoints));
  const rows: Record<string, number>[] = [];
  const emit = (t: number) => {
    const row: Record<string, number> = { t };
    for (const h of histories) {
      const v = h[key][t];
      if (v !== undefined) row[ALGO_NAMES[h.algo]] = v;
    }
    rows.push(row);
  };
  for (let t = 0; t < maxLen; t += step) emit(t);
  if (rows[rows.length - 1]?.t !== maxLen - 1) emit(maxLen - 1);
  return rows;
}

export function ConvergenceChart({ histories, instance }: { histories: SeriesHistory[]; instance: TspInstance }) {
  const data = useMemo(() => mergeSeries(histories, "best"), [histories]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#71717a" tick={{ fontSize: 10 }} />
        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={(v) => fmt(Number(v), 0)} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(Number(v))} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          y={instance.optimum}
          stroke="#a1a1aa"
          strokeDasharray="6 4"
          label={{ value: `optimum ${fmt(instance.optimum, 0)}`, fontSize: 10, fill: "#a1a1aa", position: "insideTopRight" }}
        />
        {histories.map((h) => (
          <Line
            key={h.algo}
            type="monotone"
            dataKey={ALGO_NAMES[h.algo]}
            stroke={ALGO_COLORS[h.algo]}
            dot={false}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EntropyChart({
  histories,
  instance,
  showThreshold = true,
}: {
  histories: SeriesHistory[];
  instance: TspInstance;
  showThreshold?: boolean;
}) {
  const data = useMemo(() => mergeSeries(histories, "entropy"), [histories]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#71717a" tick={{ fontSize: 10 }} />
        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(2)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {showThreshold && (
          <ReferenceLine
            y={instance.entropyTheta}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            label={{ value: `θ = ${instance.entropyTheta.toFixed(1)}`, fontSize: 10, fill: "#f43f5e", position: "insideTopRight" }}
          />
        )}
        {histories.map((h) => (
          <Line
            key={h.algo}
            type="monotone"
            dataKey={ALGO_NAMES[h.algo]}
            stroke={ALGO_COLORS[h.algo]}
            dot={false}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PdrChart({
  histories,
  instance,
  showThreshold = true,
}: {
  histories: SeriesHistory[];
  instance: TspInstance;
  showThreshold?: boolean;
}) {
  const data = useMemo(() => mergeSeries(histories, "dominance"), [histories]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="t" stroke="#71717a" tick={{ fontSize: 10 }} />
        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => Number(v).toFixed(2)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {showThreshold && (
          <ReferenceLine
            y={instance.pdrThreshold}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            label={{ value: `τ_PDR = ${instance.pdrThreshold}`, fontSize: 10, fill: "#f43f5e", position: "insideTopRight" }}
          />
        )}
        {histories.map((h) => (
          <Line
            key={h.algo}
            type="monotone"
            dataKey={ALGO_NAMES[h.algo]}
            stroke={ALGO_COLORS[h.algo]}
            dot={false}
            strokeWidth={1.6}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface ComparisonDatum {
  name: string;
  quality: number;
  time: number;
  activations: number;
}

export function ComparisonChart({ data }: { data: ComparisonDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 10 }} />
        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="quality" name="Mean best L*" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="time" name="Time (s)" fill="#f97316" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
