import { Eye, FileText, Trash2 } from "lucide-react";
import { useResultsStore } from "@/stores/resultsStore";
import { ALGO_COLORS } from "@/sim/engine";
import { aggregateRun, downloadMarkdown } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RunDetail from "@/components/results/RunDetail";

export default function ResultsPage() {
  const runs = useResultsStore((s) => s.runs);
  const selectedId = useResultsStore((s) => s.selectedId);
  const select = useResultsStore((s) => s.select);
  const deleteRun = useResultsStore((s) => s.deleteRun);
  const clearAll = useResultsStore((s) => s.clearAll);

  const selected = runs.find((r) => r.id === selectedId) ?? null;
  if (selected) {
    return <RunDetail run={selected} onBack={() => select(null)} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/60 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-100">Results</h1>
          <Badge variant="secondary">
            {runs.length} run{runs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        {runs.length > 0 && (
          <Button variant="ghost" onClick={clearAll} data-testid="clear-all">
            <Trash2 className="w-4 h-4" /> Clear history
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {runs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <p className="text-sm">No benchmark runs yet.</p>
              <p className="text-xs mt-1">Complete a run on the Run page to see results here.</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm" data-testid="history-table">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-800 text-xs uppercase tracking-wide">
                <th className="py-2 px-3">Run</th>
                <th className="py-2 px-3">Instance</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Trials</th>
                <th className="py-2 px-3">Best mean gap</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, rowIndex) => {
                const agg = aggregateRun(run);
                const best = agg.reduce((b, a) => (a.gapPct < (b?.gapPct ?? Infinity) ? a : b), agg[0]);
                return (
                  <tr
                    key={run.id}
                    className="animate-row-in border-b border-zinc-800/60 hover:bg-zinc-900/60 cursor-pointer transition-colors"
                    style={{ animationDelay: `${Math.min(rowIndex * 45, 320)}ms` }}
                    onClick={() => select(run.id)}
                  >
                    <td className="py-2.5 px-3 font-medium text-zinc-200">#{run.id}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{run.instanceName}</td>
                    <td className="py-2.5 px-3 text-zinc-500 text-xs">{new Date(run.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{run.params.trials} x 3</td>
                    <td className="py-2.5 px-3">
                      <span style={{ color: ALGO_COLORS[best.algo] }}>
                        {best.name}: {best.gapPct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          select(run.id);
                        }}
                        data-testid={`view-${run.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMarkdown(run);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRun(run.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
