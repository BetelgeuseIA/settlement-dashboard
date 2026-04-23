import { useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ToastContainer } from 'react-toastify';
import { api } from '../convex/_generated/api';
import SettlementDashboard from './components/dashboard/SettlementDashboard';

export default function Home() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const ensureReady = useMutation((api as any).settlement.ensure.ensureDashboardReady);

  useEffect(() => {
    if (!worldId) return;
    ensureReady({ worldId }).catch(() => undefined);
  }, [worldId, ensureReady]);

  return (
    <main className="min-h-screen bg-[#06080d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(9,12,18,0.92))] p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="text-[11px] uppercase tracking-[0.32em] text-amber-300/80">Settlement Dashboard</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">Ciudad de IA</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            Vista operativa del settlement: población, recursos, agentes críticos, hogares y eventos.
            Mobile-first y lista para abrirse desde tu cell.
          </p>
        </header>

        <div className="mt-5">
          {worldId ? (
            <SettlementDashboard worldId={worldId} />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/65">
              Preparando mundo base...
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}
