import type { EngineType } from "@/stores/runStore";
import { Badge } from "@/components/ui/badge";

interface EngineToggleProps {
  value: EngineType;
  onChange: (engine: EngineType) => void;
  disabled?: boolean;
}

export default function EngineToggle({ value, onChange, disabled }: EngineToggleProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-zinc-300">Simulation Engine</span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("typescript")}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            value === "typescript"
              ? "bg-green-600/20 text-green-400 ring-1 ring-green-600/40"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          TypeScript
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            Mulberry32
          </Badge>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("python")}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            value === "python"
              ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-600/40"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          Python
          <Badge variant="secondary" className="ml-1.5 text-[10px]">
            NumPy PCG64
          </Badge>
        </button>
      </div>
      {value === "python" && (
        <p className="text-[10px] text-blue-400/70">Thesis-exact results (NumPy PCG64 PRNG).</p>
      )}
    </div>
  );
}
