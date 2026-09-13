import { Link, useLocation } from "react-router-dom";
import { Play, FlaskConical, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Run", icon: Play },
  { to: "/simulate", label: "Simulate", icon: FlaskConical },
  { to: "/results", label: "Results", icon: BarChart3 },
];

export default function Sidebar({ isMobile }: { isMobile: boolean }) {
  const location = useLocation();

  return (
    <nav
      data-testid="sidebar"
      className={`w-64 h-screen bg-zinc-900 border-r border-zinc-800 fixed left-0 top-0 bottom-0 z-50 flex flex-col ${
        isMobile ? "hidden" : ""
      }`}
    >
      <div className="p-4 border-b border-zinc-800">
        <Link to="/" className="flex items-center gap-2 text-zinc-100 font-semibold text-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          HACO Benchmark
        </Link>
        <p className="text-xs text-zinc-500 mt-1">Entropy-Triggered 2-opt Simulator</p>
      </div>

      <ul className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-600/15 text-green-400 border border-green-600/30"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="p-4 border-t border-zinc-800">
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Entropy-Triggered 2-opt in Hybrid ACO
          <br />
          Multi-Instance Evaluation
        </p>
      </div>
    </nav>
  );
}
