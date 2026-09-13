interface LoaderProps {
  label?: string;
}

/**
 * Full-area loading overlay shown while benchmark engines are being
 * prepared, so the transition never reads as a frozen UI.
 */
export default function Loader({ label = "Preparing engines" }: LoaderProps) {
  return (
    <div
      data-testid="loader"
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-zinc-950/70 backdrop-blur-sm"
    >
      <div className="flex items-end gap-2" aria-hidden="true">
        <span className="loader-dot" />
        <span className="loader-dot" style={{ animationDelay: "0.15s" }} />
        <span className="loader-dot" style={{ animationDelay: "0.3s" }} />
      </div>
      <p className="text-xs text-zinc-400 tracking-widest uppercase">{label}</p>
    </div>
  );
}
