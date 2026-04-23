import { MutationCtx, QueryCtx } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';

type Ctx = MutationCtx | QueryCtx;

type SettlementDoc = Doc<'settlements'>;

export const STALE_AFTER_MS = 5 * 60 * 1000;
export const RECENT_CYCLE_LIMIT = 8;

export async function getSettlementAudit(ctx: Ctx, worldId: Id<'worlds'>, settlement?: SettlementDoc | null) {
  const settlementDoc =
    settlement ??
    (await ctx.db
      .query('settlements')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .first());

  if (!settlementDoc) {
    return null;
  }

  const [recentCycles, recentEvents] = await Promise.all([
    ctx.db
      .query('settlementCycles')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .order('desc')
      .take(RECENT_CYCLE_LIMIT),
    ctx.db
      .query('settlementEvents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .order('desc')
      .take(RECENT_CYCLE_LIMIT),
  ]);

  const now = Date.now();
  const lastCycleAt =
    settlementDoc.lastCycleAt ?? recentCycles[0]?.completedAt ?? recentCycles[0]?.startedAt ?? null;
  const lastEventAt = recentEvents[0]?.createdAt ?? null;
  const freshestAt = Math.max(lastCycleAt ?? 0, lastEventAt ?? 0, settlementDoc.updatedAt ?? 0);
  const dataAgeMs = freshestAt > 0 ? now - freshestAt : null;
  const isStale = dataAgeMs === null ? true : dataAgeMs > STALE_AFTER_MS;

  return {
    meta: {
      settlementId: settlementDoc._id,
      worldId,
      status: settlementDoc.status,
      cycle: settlementDoc.tick,
      tick: settlementDoc.tick,
      lastCycleAt,
      lastEventAt,
      dataAgeMs,
      isStale,
      staleAfterMs: STALE_AFTER_MS,
      heartbeat: recentCycles.length > 0 ? 'cycles' : recentEvents.length > 0 ? 'events_only' : 'missing',
      recentCycles: recentCycles.map((cycle) => ({
        cycle: cycle.cycle,
        tick: cycle.tick,
        status: cycle.status,
        startedAt: cycle.startedAt,
        completedAt: cycle.completedAt ?? null,
        durationMs:
          cycle.durationMs ??
          (cycle.completedAt ? Math.max(0, cycle.completedAt - cycle.startedAt) : null),
        resolvedTasks: cycle.resolvedTasks ?? null,
        pendingTasksAfter: cycle.pendingTasksAfter ?? null,
        summary: cycle.summary ?? null,
      })),
    },
    recentEvents,
  };
}
