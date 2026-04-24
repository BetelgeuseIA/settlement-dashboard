import type { ReactNode } from 'react';

type Tone = 'red' | 'green' | 'amber' | 'blue' | 'slate';

type DashboardData = {
  meta?: {
    lastCycleAt?: number;
    lastEventAt?: number;
    dataAgeMs?: number;
    isStale?: boolean;
    staleAfterMs?: number;
    heartbeat?: 'live' | 'stale';
  } | null;
  settlement: {
    id?: string;
    worldId?: string;
    name: string;
    status: string;
    tick: number;
    emergencyMode?: boolean;
    emergencyReason?: string;
  };
  alerts: {
    emergencyMode: boolean;
    criticalAgents: number;
    pendingTasks: number;
    isStale?: boolean;
  };
  summary: {
    population: number;
    totalFood: number;
    totalWood: number;
    totalStone: number;
    avgHunger: number;
    avgEnergy: number;
    avgSafety: number;
    avgMorale: number;
  };
  taskSummary?: {
    total: number;
    byType: Record<string, number>;
  };
  counts?: {
    tasks?: {
      total: number;
      byType: Record<string, number>;
      byStatus?: Record<string, number>;
    };
  };
  audit?: {
    recentEvents?: Array<{
      _id: string;
      type: string;
      summary: string;
      tick: number;
      createdAt?: number;
    }>;
  };
  criticalAgents: Array<{
    _id: string;
    playerId: string;
    role?: string;
    hunger: number;
    energy: number;
    safety: number;
    morale?: number;
    updatedAt?: number;
  }>;
  topStrainedHouseholds: Array<{
    _id: string;
    name: string;
    memberIds: string[];
    food: number;
    wood: number;
    stone: number;
    strainScore?: number;
  }>;
  topProductiveHouseholds: Array<{
    _id: string;
    name: string;
    memberIds: string[];
    food: number;
    wood: number;
    stone: number;
    productivityScore?: number;
  }>;
  events: Array<{
    _id: string;
    type: string;
    summary: string;
    tick: number;
    createdAt?: number;
  }>;
};

export default function SettlementDashboard({ data, controls }: { data: DashboardData | null | undefined; controls?: { onRefresh?: () => void | Promise<void>; onRunCycle?: () => void | Promise<void>; busyAction?: string | null } }) {
  if (data === undefined) {
    return <SkeletonDashboard />;
  }

  if (!data) {
    return (
      <SkeletonDashboard message="Sin datos todavía. Si esto no cambia en unos segundos, hay un fallo real de conexión o inicialización." />
    );
  }

  const { settlement, alerts, summary } = data;
  const resourceTotal = summary.totalFood + summary.totalWood + summary.totalStone;
  const liveliness = data.meta?.isStale ? 'STALE' : 'LIVE';
  const liveTone: Tone = data.meta?.isStale ? 'red' : alerts.emergencyMode ? 'amber' : 'green';
  const freshnessSeconds = typeof data.meta?.dataAgeMs === 'number' ? Math.max(0, Math.round(data.meta.dataAgeMs / 1000)) : null;
  const resourcePressure = Math.max(0, Math.min(100, Math.round((summary.totalFood / Math.max(summary.population * 3, 1)) * 100)));
  const moraleRisk = riskBand(100 - summary.avgMorale, [25, 55]);
  const hungerRisk = riskBand(summary.avgHunger, [45, 72]);
  const energyRisk = inverseRiskBand(summary.avgEnergy, [65, 38]);
  const safetyRisk = inverseRiskBand(summary.avgSafety, [72, 42]);
  const taskSummary = data.taskSummary ?? data.counts?.tasks ?? { total: 0, byType: {}, byStatus: {} };
  const events = data.events ?? data.audit?.recentEvents ?? [];
  const dominantTask = Object.entries(taskSummary.byType ?? {}).sort((a, b) => b[1] - a[1])[0];

  const operationalAlerts = [
    alerts.emergencyMode
      ? {
          title: 'Emergency mode active',
          body: settlement.emergencyReason ? humanizeLabel(settlement.emergencyReason) : 'Escalation protocol raised by policy engine.',
          tone: 'red' as Tone,
        }
      : null,
    alerts.criticalAgents > 0
      ? {
          title: `${alerts.criticalAgents} critical agents need intervention`,
          body: 'Hunger, fatigue, safety or morale crossed response thresholds.',
          tone: 'amber' as Tone,
        }
      : null,
    alerts.pendingTasks > 6
      ? {
          title: 'Task queue saturating',
          body: 'Pending work is building faster than the crews can absorb it.',
          tone: 'blue' as Tone,
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; body: string; tone: Tone }>;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(248,113,113,0.14),transparent_28%),linear-gradient(180deg,rgba(10,14,23,0.98),rgba(6,9,15,0.98))] p-4 shadow-[0_24px_90px_rgba(2,8,23,0.55)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-100/75">
          <Badge tone={liveTone}>{liveliness}</Badge>
          <Badge tone="slate">tick {settlement.tick}</Badge>
          <Badge tone={settlement.status === 'active' ? 'green' : 'amber'}>{settlement.status}</Badge>
          {freshnessSeconds !== null ? <Badge tone={liveTone}>{freshnessSeconds}s fresh</Badge> : null}
        </div>

        <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">{settlement.name} command center</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200/72 sm:text-base">
                Live operational view for stability, resource pressure and crew throughput.
              </p>
            </div>

            <div className="w-full lg:max-w-[520px]">
              <div className={`rounded-[22px] border p-3 ${liveTone === 'red' ? 'border-red-400/40 bg-red-500/18' : liveTone === 'amber' ? 'border-amber-400/35 bg-amber-500/14' : 'border-emerald-400/30 bg-emerald-500/12'}`}>
                <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.18em] text-white/78">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${liveTone === 'red' ? 'bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.8)]' : liveTone === 'amber' ? 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]' : 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]'}`} />
                    <span>{liveliness}</span>
                  </div>
                  <div>Pop {summary.population}</div>
                  <div className={alerts.criticalAgents > 0 ? 'text-red-100' : 'text-emerald-100'}>{alerts.criticalAgents ? `${alerts.criticalAgents} crit` : '0 crit'}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-white">
                  <CompactMetric label="Tasks" value={alerts.pendingTasks} />
                  <CompactMetric label="Resources" value={resourceTotal} />
                  <CompactMetric label="Morale" value={formatMetric(summary.avgMorale)} />
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/58">
                    <span>Food buffer</span>
                    <span>{resourcePressure}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${resourcePressure < 40 ? 'bg-gradient-to-r from-red-400 to-amber-300' : resourcePressure < 75 ? 'bg-gradient-to-r from-amber-300 to-yellow-200' : 'bg-gradient-to-r from-emerald-400 to-cyan-300'}`} style={{ width: `${Math.max(8, Math.min(100, resourcePressure))}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionButton onClick={controls?.onRefresh} busy={controls?.busyAction === 'refresh'}>
            ↺ Refresh
          </ActionButton>
          <ActionButton onClick={controls?.onRunCycle} busy={controls?.busyAction === 'cycle'} tone="primary">
            ▶ Run cycle
          </ActionButton>
        </div>

        {operationalAlerts.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {operationalAlerts.map((alert) => (
              <DominantAlert key={alert.title} {...alert} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-emerald-400/30 bg-emerald-500/16 px-4 py-3 text-sm font-medium text-emerald-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]">
            No dominant alerts. Current posture is stable and crews are inside expected thresholds.
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel title="Operational flow" eyebrow="resources → tasks → effects">
          <div className="grid gap-3 sm:grid-cols-3">
            <FlowCard
              title="Resource reserves"
              tone={resourceTotal < summary.population * 10 ? 'amber' : 'green'}
              items={[
                `${summary.totalFood} food in storage`,
                `${summary.totalWood} wood for build cycles`,
                `${summary.totalStone} stone for reinforcement`,
              ]}
            />
            <FlowCard
              title="Task pressure"
              tone={alerts.pendingTasks > summary.population ? 'amber' : 'blue'}
              items={[
                `${alerts.pendingTasks} pending tasks`,
                dominantTask ? `${dominantTask[1]} ${humanizeLabel(dominantTask[0])}` : 'No dominant task type',
                `${Object.keys(taskSummary.byType ?? {}).length} active lanes`,
              ]}
            />
            <FlowCard
              title="Settlement effects"
              tone={alerts.criticalAgents > 0 ? 'red' : 'green'}
              items={[
                `${formatMetric(summary.avgMorale)} morale baseline`,
                `${formatMetric(summary.avgSafety)} safety confidence`,
                alerts.criticalAgents > 0 ? 'Intervention required now' : 'Effects remain contained',
              ]}
            />
          </div>
        </Panel>

        <Panel title="Live meta" eyebrow="freshness + risk envelope">
          <div className="grid grid-cols-2 gap-3">
            <MetaCard label="Feed state" value={liveliness} tone={liveTone} />
            <MetaCard label="Emergency" value={alerts.emergencyMode ? 'ON' : 'OFF'} tone={alerts.emergencyMode ? 'red' : 'green'} />
            <MetaCard label="Freshness" value={freshnessSeconds !== null ? `${freshnessSeconds}s` : 'unknown'} tone={liveTone} />
            <MetaCard label="Heartbeat" value={data.meta?.heartbeat?.toUpperCase?.() ?? liveliness} tone={liveTone} />
            <MetaCard label="Hunger risk" value={hungerRisk.label} tone={hungerRisk.tone} />
            <MetaCard label="Morale risk" value={moraleRisk.label} tone={moraleRisk.tone} />
            <MetaCard label="Energy risk" value={energyRisk.label} tone={energyRisk.tone} />
            <MetaCard label="Safety risk" value={safetyRisk.label} tone={safetyRisk.tone} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Resource and health baseline" eyebrow="settlement vitals">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Food" value={summary.totalFood} helper="consumption buffer" tone={summary.totalFood < summary.population * 3 ? 'amber' : 'green'} />
            <MetricCard label="Wood" value={summary.totalWood} helper="build fuel" tone="blue" />
            <MetricCard label="Stone" value={summary.totalStone} helper="defense stock" tone="slate" />
            <MetricCard label="Population" value={summary.population} helper="agents online" tone="slate" />
            <MetricCard label="Avg hunger" value={formatMetric(summary.avgHunger)} helper="lower is better" tone={hungerRisk.tone} />
            <MetricCard label="Avg energy" value={formatMetric(summary.avgEnergy)} helper="higher is better" tone={energyRisk.tone} />
            <MetricCard label="Avg safety" value={formatMetric(summary.avgSafety)} helper="higher is better" tone={safetyRisk.tone} />
            <MetricCard label="Avg morale" value={formatMetric(summary.avgMorale)} helper="cohesion signal" tone={moraleRisk.tone} />
          </div>
        </Panel>

        <Panel title="Task composition" eyebrow="queue distribution">
          <div className="space-y-3">
            {Object.entries(taskSummary.byType ?? {})
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const ratio = taskSummary.total ? (count / taskSummary.total) * 100 : 0;
                return (
                  <div key={type} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3 text-sm text-white">
                      <span className="font-medium">{humanizeLabel(type)}</span>
                      <span className="text-white/65">{count}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-300" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Critical agents" eyebrow="intervene first">
          <div className="space-y-3">
            {(data.criticalAgents ?? []).length ? (
              (data.criticalAgents ?? []).map((agent) => (
                <EntityCard
                  key={agent._id}
                  title={humanizeAgent(agent.playerId)}
                  subtitle={(agent.role ?? 'unknown').toUpperCase()}
                  emphasis="critical"
                  pills={[
                    `hunger ${agent.hunger}`,
                    `energy ${agent.energy}`,
                    `safety ${agent.safety}`,
                    `morale ${agent.morale ?? 60}`,
                  ]}
                />
              ))
            ) : (
              <EmptyState text="No agents in critical band." />
            )}
          </div>
        </Panel>

        <Panel title="Households under strain" eyebrow="fragile segments">
          <div className="space-y-3">
            {data.topStrainedHouseholds.map((household) => (
              <EntityCard
                key={household._id}
                title={household.name}
                subtitle={`${(household.memberIds ?? []).length} members`}
                emphasis="warning"
                pills={[
                  `strain ${household.strainScore ?? 0}`,
                  `food ${household.food}`,
                  `wood ${household.wood}`,
                  `stone ${household.stone}`,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Top productive households" eyebrow="available leverage">
          <div className="space-y-3">
            {data.topProductiveHouseholds.map((household) => (
              <EntityCard
                key={household._id}
                title={household.name}
                subtitle={`${(household.memberIds ?? []).length} members`}
                emphasis="positive"
                pills={[
                  `productivity ${household.productivityScore ?? 0}`,
                  `food ${household.food}`,
                  `wood ${household.wood}`,
                  `stone ${household.stone}`,
                ]}
              />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Operational timeline" eyebrow="recent activity">
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={event._id} className="grid grid-cols-[auto_1fr] gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-3 sm:p-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.12)]" />
                {index !== events.length - 1 ? <div className="mt-2 h-full w-px bg-white/10" /> : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  <span>{humanizeLabel(event.type)}</span>
                  <span>tick {event.tick}</span>
                </div>
                <div className="mt-2 text-sm leading-relaxed text-white/82 sm:text-[15px]">{event.summary}</div>
              </div>
            </div>
          ))}
        </div>
        {!events.length ? <EmptyState text="No recent events available yet." /> : null}
      </Panel>
    </div>
  );
}

function humanizeAgent(playerId: string) {
  const suffix = playerId.split('|').pop() ?? playerId;
  return `Agent ${suffix.slice(-6)}`;
}

function humanizeLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function formatMetric(value: number) {
  return value.toFixed(1);
}

function riskBand(value: number, [medium, high]: [number, number]) {
  if (value >= high) return { label: 'HIGH', tone: 'red' as Tone };
  if (value >= medium) return { label: 'WATCH', tone: 'amber' as Tone };
  return { label: 'LOW', tone: 'green' as Tone };
}

function inverseRiskBand(value: number, [healthy, danger]: [number, number]) {
  if (value <= danger) return { label: 'HIGH', tone: 'red' as Tone };
  if (value <= healthy) return { label: 'WATCH', tone: 'amber' as Tone };
  return { label: 'LOW', tone: 'green' as Tone };
}

function SkeletonDashboard({ message = 'Cargando panel operativo...' }: { message?: string }) {
  return (
    <div className="space-y-4">
      <div className="h-56 animate-pulse rounded-[30px] border border-white/10 bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        <div className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">{message}</div>
    </div>
  );
}

function Panel({ children, title, eyebrow }: { children: ReactNode; title?: string; eyebrow?: string }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.9),rgba(9,12,20,0.94))] p-4 shadow-xl shadow-black/20 sm:p-5">
      {(title || eyebrow) ? (
        <div className="mb-4">
          {eyebrow ? <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/45">{eyebrow}</div> : null}
          {title ? <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function CompactMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/50">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function MetricCard({ label, value, helper, tone = 'slate' }: { label: string; value: string | number; helper: string; tone?: Tone }) {
  return (
    <div className={`rounded-2xl border p-4 ${toneSurface[tone]}`}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/48">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/58">{helper}</div>
    </div>
  );
}

function MetaCard({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className={`rounded-2xl border p-3 ${toneSurface[tone]}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: Tone }) {
  return <span className={`rounded-full border px-2.5 py-1 ${toneSurface[tone]}`}>{children}</span>;
}

function DominantAlert({ title, body, tone }: { title: string; body: string; tone: Tone }) {
  const accent = tone === 'red' ? 'bg-red-400' : tone === 'amber' ? 'bg-amber-300' : tone === 'blue' ? 'bg-cyan-300' : 'bg-emerald-300';
  const shell = tone === 'red'
    ? 'border-red-400/45 bg-red-500/22 shadow-[0_0_0_1px_rgba(248,113,113,0.08),0_18px_40px_rgba(127,29,29,0.22)]'
    : tone === 'amber'
      ? 'border-amber-300/45 bg-amber-500/18 shadow-[0_0_0_1px_rgba(252,211,77,0.08),0_18px_40px_rgba(120,53,15,0.18)]'
      : tone === 'blue'
        ? 'border-cyan-300/35 bg-cyan-500/14 shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_18px_40px_rgba(8,47,73,0.18)]'
        : toneSurface[tone];
  return (
    <div className={`rounded-[26px] border p-0 ${shell}`}>
      <div className="grid grid-cols-[6px_1fr] overflow-hidden rounded-[26px]">
        <div className={accent} />
        <div className="px-4 py-3">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/82">{body}</div>
        </div>
      </div>
    </div>
  );
}

function FlowCard({ title, items, tone }: { title: string; items: string[]; tone: Tone }) {
  return (
    <div className={`rounded-3xl border p-4 ${toneSurface[tone]}`}>
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-3 space-y-2 text-sm text-white/75">
        {items.map((item) => (
          <div key={item} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EntityCard({ title, subtitle, pills, emphasis }: { title: string; subtitle: string; pills: string[]; emphasis: 'critical' | 'warning' | 'positive' }) {
  const emphasisTone = emphasis === 'critical' ? 'red' : emphasis === 'warning' ? 'amber' : 'green';
  return (
    <div className={`rounded-3xl border p-3 ${toneSurface[emphasisTone]}`}>
      <div className="font-medium text-white">{title}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{subtitle}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/72">
        {pills.map((pill) => (
          <span key={pill} className="rounded-full border border-white/10 bg-black/10 px-2 py-1">{pill}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">{text}</div>;
}

function ActionButton({ children, onClick, busy, tone = 'default' }: { children: ReactNode; onClick?: () => void | Promise<void>; busy?: boolean; tone?: 'default' | 'primary' }) {
  const shell = tone === 'primary'
    ? 'border-cyan-300/35 bg-cyan-400/15 text-cyan-50'
    : 'border-white/10 bg-white/[0.04] text-white';
  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      disabled={!onClick || busy}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${shell}`}
    >
      {busy ? 'Working…' : children}
    </button>
  );
}

const toneSurface: Record<Tone, string> = {
  red: 'border-red-400/35 bg-red-500/16 text-red-50',
  green: 'border-emerald-400/28 bg-emerald-500/12 text-emerald-50',
  amber: 'border-amber-300/35 bg-amber-500/14 text-amber-50',
  blue: 'border-cyan-300/28 bg-cyan-500/12 text-cyan-50',
  slate: 'border-white/10 bg-white/[0.04] text-white',
};
