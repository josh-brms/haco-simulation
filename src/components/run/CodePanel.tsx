import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CODE_FILES } from "./codeSnippets";

export interface CodePanelProps {
  fileKey: string;
  highlightLine?: number; // 1-based; 0/undefined = none
  className?: string;
  autoScroll?: boolean;
}

const PY_TOKEN =
  /(#[^\n]*)|("(?:[^"\\]|\\.)*")|\b(\d+(?:\.\d+)?)\b|\b(def|return|if|elif|else|for|in|while|import|from|as|and|or|not|None|True|False|lambda|with|class|try|except)\b|([A-Za-z_][A-Za-z0-9_]*)(?=\()/g;

const TOKEN_CLASS = [
  "text-zinc-500 italic", // 1 comment
  "text-emerald-400", //    2 string
  "text-amber-400", //      3 number
  "text-green-400", //       4 keyword
  "text-green-400", //     5 call
];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Single-pass Python tokenizer: wraps each token once, no re-scan of markup. */
function highlightPython(code: string): string {
  const out: string[] = [];
  let last = 0;
  PY_TOKEN.lastIndex = 0;
  for (let m = PY_TOKEN.exec(code); m !== null; m = PY_TOKEN.exec(code)) {
    out.push(escapeHtml(code.slice(last, m.index)));
    const groupIndex = m.slice(1).findIndex((g) => g !== undefined);
    out.push(`<span class="${TOKEN_CLASS[groupIndex]}">${escapeHtml(m[0])}</span>`);
    last = m.index + m[0].length;
  }
  out.push(escapeHtml(code.slice(last)));
  return out.join("");
}

export default function CodePanel({ fileKey, highlightLine = 0, className, autoScroll = false }: CodePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const file = CODE_FILES[fileKey] ?? CODE_FILES.adaptive_haco;

  const rendered = useMemo(() => file.code.split("\n").map((l) => highlightPython(l)), [file.code]);

  useEffect(() => {
    if (autoScroll && highlightLine > 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-line="${highlightLine}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [highlightLine, autoScroll]);

  return (
    <div
      ref={containerRef}
      data-testid="code-panel"
      className={cn("overflow-auto font-mono text-[11px] leading-relaxed bg-zinc-950 rounded-md border border-zinc-800", className)}
    >
      <table className="w-full border-collapse">
        <tbody>
          {rendered.map((html, i) => {
            const lineNo = i + 1;
            const active = lineNo === highlightLine;
            return (
              <tr
                key={i}
                data-line={lineNo}
                className={cn(
                  "transition-colors",
                  active ? "bg-green-600/20 border-l-2 border-green-500" : "border-l-2 border-transparent hover:bg-zinc-900"
                )}
              >
                <td className="select-none text-right pr-2 pl-3 w-10 text-zinc-600 align-top">{lineNo}</td>
                <td className="pr-4 whitespace-pre text-zinc-300 align-top">
                  <span dangerouslySetInnerHTML={{ __html: html }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
