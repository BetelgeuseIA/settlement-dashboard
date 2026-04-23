import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ToastContainer } from 'react-toastify';
import SettlementDashboard from './components/dashboard/SettlementDashboard';
import { api } from '../convex/_generated/api';

export default function Home() {
  const ensureReady = useMutation((api as any).settlement.ensure.ensureDashboardReady);
  const data = useQuery((api as any).dashboardPublic.getDashboard) as any;
  const seededRef = useRef(false);
  const [ensureError, setEnsureError] = useState<string | null>(null);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    ensureReady({}).catch((error) => {
      console.error('ensureReady failed', error);
      setEnsureError(error?.message ?? 'No se pudo inicializar el settlement');
      seededRef.current = false;
    });
  }, [ensureReady]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_26%),linear-gradient(180deg,#04060b_0%,#07111c_50%,#04060b_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.12),transparent_32%),linear-gradient(180deg,rgba(15,20,32,0.98),rgba(7,10,17,0.96))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/75">Settlement Dashboard</div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Operational command layer</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
                Live hierarchy for alerts, resources, crew pressure and recent settlement effects.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-white/55">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-100">mobile-first</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-100">live data</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">deploy-ready scope</span>
            </div>
          </div>
        </header>

        {ensureError ? (
          <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            Error inicializando datos: {ensureError}
          </div>
        ) : null}

        <div className="mt-5">
          <SettlementDashboard data={data} />
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}
