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
    <main className="min-h-screen bg-[#05070c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(72,95,180,0.22),transparent_45%),linear-gradient(180deg,rgba(15,20,32,0.98),rgba(8,10,16,0.94))] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.32em] text-amber-300/80">Settlement Dashboard</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Operaciones del Asentamiento</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
            Vista operativa en tiempo real de recursos, hogares, agentes críticos y eventos recientes.
          </p>
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
