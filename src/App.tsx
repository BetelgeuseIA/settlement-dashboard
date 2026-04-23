import { useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ToastContainer } from 'react-toastify';
import SettlementDashboard from './components/dashboard/SettlementDashboard';
import { api } from '../convex/_generated/api';

export default function Home() {
  const ensureReady = useMutation((api as any).dashboardPublic.ensureReady);
  const data = useQuery((api as any).dashboardPublic.getDashboard) as any;

  useEffect(() => {
    ensureReady({}).catch(() => undefined);
  }, [ensureReady]);

  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(72,95,180,0.22),transparent_45%),linear-gradient(180deg,rgba(15,20,32,0.98),rgba(8,10,16,0.94))] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.32em] text-amber-300/80">Settlement Dashboard</div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Ciudad de IA</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-base">
            Centro de control del settlement: recursos, hogares, agentes críticos y eventos. Diseñado
            para verse sólido desde móvil.
          </p>
        </header>

        <div className="mt-5">
          <SettlementDashboard data={data} />
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}
