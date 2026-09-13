import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import RunPage from "@/pages/RunPage";
import SimulatePage from "@/pages/SimulatePage";
import ResultsPage from "@/pages/ResultsPage";

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar isMobile={isMobile} />
        <main className="flex-1 ml-64 min-w-0">
          <RoutedPages />
        </main>
      </div>
    </BrowserRouter>
  );
}

/** Re-mounts the active page on route change so the entrance animation plays. */
function RoutedPages() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-in">
      <Routes>
        <Route path="/" element={<RunPage />} />
        <Route path="/simulate" element={<SimulatePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
