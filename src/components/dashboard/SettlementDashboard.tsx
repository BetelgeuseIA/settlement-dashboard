export default function SettlementDashboard({ data }: { data: any }) {
  if (data === undefined) {
    return <SkeletonDashboard />;
  }

  if (!data) {
    return <SkeletonDashboard message="Sembrando el settlement inicial..." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AlertCard label="Emergency" value={data.alerts.emergencyMode ? 'ON' : 'OFF'} tone={data.alerts.emergencyMode ? 'red' : 'green'} />
        <AlertCard label="Critical agents" value={data.alerts.criticalAgents} tone={data.alerts.criticalAgents > 0 ? 'amber' : 'green'} />
        <AlertCard label="Pending tasks" value={data.alerts.pendingTasks} tone="blue" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Population" value={data.summary.population} />
        <MetricCard label="Food" value={data.summary.totalFood} />
        <MetricCard label="Wood" value={data.summary.totalWood} />
        <MetricCard label="Stone" value={data.summary.totalStone} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Avg hunger" value={data.summary.avgHunger.toFixed(1)} />
        <MetricCard label="Avg energy" value={data.summary.avgEnergy.toFixed(1)} />
        <MetricCard label="Avg safety" value={data.summary.avgSafety.toFixed(1)} />
        <MetricCard label="Avg morale" value={data.summary.avgMorale.toFixed(1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Task summary">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {Object.entries(data.taskSummary.byType).map(([type, count]) => (
              <MiniPill key={type} label={String(type).replaceAll('_', ' ')} value={count as number} />
            ))}
          </div>
        </Panel>

        <Panel title="Critical agents">
          <div className="space-y-2">
            {data.criticalAgents.map((agent: any) => (
              <RowCard
                key={agent._id}
                title={humanizeAgent(agent.playerId)}
                subtitle={(agent.role ?? 'unknown').toUpperCase()}
                stats={[
                  `hunger ${agent.hunger}`,
                  `energy ${agent.energy}`,
                  `safety ${agent.safety}`,
                  `morale ${agent.morale ?? 60}`,
                ]}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Households under strain">
          <div className="space-y-2">
            {data.topStrainedHouseholds.map((household: any) => (
              <RowCard
                key={household._id}
                title={household.name}
                subtitle={`${household.memberIds.length} miembros`}
                stats={[
                  `strain ${household.strainScore ?? 0}`,
                  `food ${household.food}`,
                  `wood ${household.wood}`,
                  `stone ${household.stone}`,
                ]}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Top productive households">
          <div className="space-y-2">
            {data.topProductiveHouseholds.map((household: any) => (
              <RowCard
                key={household._id}
                title={household.name}
                subtitle={`${household.memberIds.length} miembros`}
                stats={[
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

      <Panel title="Recent events">
        <div className="space-y-2">
          {data.events.map((event: any) => (
            <div key={event._id} className="rounded-2xl border border-white/8 bg-white/5 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-white">{event.type}</span>
                <span className="text-xs text-white/45">tick {event.tick}</span>
              </div>
              <div className="mt-1 text-white/70">{event.summary}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function humanizeAgent(playerId: string) {
  const suffix = playerId.split('|').pop() ?? playerId;
  return `Agent ${suffix.slice(-6)}`;
}

function SkeletonDashboard({ message = 'Cargando panel operativo...' }: { message?: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => <div key={n} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/70">{message}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => <div key={n} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
      </div>
    </div>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 sm:p-5">
      {title ? <h2 className="mb-3 text-base font-semibold text-white sm:text-lg">{title}</h2> : null}
      {children}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function AlertCard({ label, value, tone }: { label: string; value: string | number; tone: 'red' | 'green' | 'amber' | 'blue' }) {
  const toneClass = {
    red: 'text-red-300 border-red-400/20 bg-red-400/10',
    green: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10',
    amber: 'text-amber-300 border-amber-400/20 bg-amber-400/10',
    blue: 'text-sky-300 border-sky-400/20 bg-sky-400/10',
  }[tone];
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-[0.18em] opacity-75">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function RowCard({ title, subtitle, stats }: { title: string; subtitle: string; stats: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="font-medium text-white">{title}</div>
      <div className="text-xs uppercase tracking-[0.16em] text-white/40">{subtitle}</div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
        {stats.map((stat) => (
          <span key={stat} className="rounded-full border border-white/10 px-2 py-1">{stat}</span>
        ))}
      </div>
    </div>
  );
}
