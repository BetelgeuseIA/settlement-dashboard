import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';

export default function SettlementDashboard({ worldId }: { worldId: Id<'worlds'> }) {
  const data = useQuery((api as any).settlement.dashboard.getDashboard, { worldId }) as
    | {
        settlement: Doc<'settlements'>;
        summary: {
          population: number;
          totalFood: number;
          totalWood: number;
          totalStone: number;
          avgHunger: number;
          avgEnergy: number;
          avgSafety: number;
          avgMorale: number;
          pendingTasks: number;
          criticalAgents: number;
        };
        households: Doc<'households'>[];
        agents: Doc<'agentNeeds'>[];
        events: Doc<'settlementEvents'>[];
      }
    | null
    | undefined;

  if (data === undefined) {
    return <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">Loading settlement dashboard...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">No settlement bootstrapped yet for this world.</div>;
  }

  const { settlement, summary, households, agents, events } = data;

  return (
    <div className="space-y-4 text-white">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Population" value={summary.population} />
        <MetricCard label="Tick" value={settlement.tick} />
        <MetricCard label="Pending tasks" value={summary.pendingTasks} />
        <MetricCard label="Critical agents" value={summary.criticalAgents} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Food" value={summary.totalFood} />
        <MetricCard label="Wood" value={summary.totalWood} />
        <MetricCard label="Stone" value={summary.totalStone} />
        <MetricCard label="Emergency" value={settlement.emergencyMode ? 'ON' : 'OFF'} tone={settlement.emergencyMode ? 'red' : 'green'} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Avg hunger" value={summary.avgHunger.toFixed(1)} />
        <MetricCard label="Avg energy" value={summary.avgEnergy.toFixed(1)} />
        <MetricCard label="Avg safety" value={summary.avgSafety.toFixed(1)} />
        <MetricCard label="Avg morale" value={summary.avgMorale.toFixed(1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="mb-3 text-lg font-semibold">Households</h2>
          <div className="space-y-2">
            {households.map((household: Doc<'households'>) => (
              <div key={household._id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong>{household.name}</strong>
                  <span className="text-white/60">members: {household.memberIds.length}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-white/80">
                  <span>food {household.food}</span>
                  <span>wood {household.wood}</span>
                  <span>stone {household.stone}</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-white/60">
                  <span>productivity {(household.productivityScore ?? 0).toFixed?.(0) ?? household.productivityScore ?? 0}</span>
                  <span>strain {(household.strainScore ?? 0).toFixed?.(0) ?? household.strainScore ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="mb-3 text-lg font-semibold">Agents</h2>
          <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
            {agents.map((agent: Doc<'agentNeeds'>) => (
              <div key={agent._id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <strong>{agent.playerId}</strong>
                  <span className="uppercase text-white/60">{agent.role ?? 'unknown'}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-white/80">
                  <span>hunger {agent.hunger}</span>
                  <span>energy {agent.energy}</span>
                  <span>safety {agent.safety}</span>
                  <span>morale {agent.morale ?? 60}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="mb-3 text-lg font-semibold">Recent events</h2>
        <div className="space-y-2 text-sm text-white/80">
          {events.map((event: Doc<'settlementEvents'>) => (
            <div key={event._id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{event.type}</span>
                <span className="text-white/50">tick {event.tick}</span>
              </div>
              <p className="mt-1 text-white/70">{event.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'red' | 'green' }) {
  const toneClass = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-emerald-300' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
