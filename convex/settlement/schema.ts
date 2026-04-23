import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { playerId } from '../aiTown/ids';

export const needFields = {
  hunger: v.number(),
  energy: v.number(),
  safety: v.number(),
};

export const settlementTables = {
  settlements: defineTable({
    worldId: v.id('worlds'),
    name: v.string(),
    status: v.union(v.literal('bootstrapping'), v.literal('active'), v.literal('paused')),
    tick: v.number(),
    emergencyMode: v.optional(v.boolean()),
    emergencyReason: v.optional(v.string()),
    lastCycleAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index('worldId', ['worldId']),

  households: defineTable({
    worldId: v.id('worlds'),
    name: v.string(),
    memberIds: v.array(playerId),
    food: v.number(),
    wood: v.number(),
    stone: v.number(),
    productivityScore: v.optional(v.number()),
    strainScore: v.optional(v.number()),
  }).index('worldId', ['worldId']),

  agentNeeds: defineTable({
    worldId: v.id('worlds'),
    playerId,
    ...needFields,
    updatedAt: v.number(),
    role: v.optional(v.union(v.literal('forager'), v.literal('builder'), v.literal('guard'), v.literal('laborer'))),
    morale: v.optional(v.number()),
  })
    .index('worldId', ['worldId'])
    .index('playerId', ['worldId', 'playerId']),

  taskQueue: defineTable({
    worldId: v.id('worlds'),
    playerId: v.optional(playerId),
    householdId: v.optional(v.id('households')),
    type: v.union(
      v.literal('gather_food'),
      v.literal('gather_wood'),
      v.literal('gather_stone'),
      v.literal('eat'),
      v.literal('rest'),
      v.literal('idle'),
    ),
    status: v.union(v.literal('pending'), v.literal('assigned'), v.literal('done'), v.literal('cancelled')),
    priority: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    role: v.optional(v.union(v.literal('forager'), v.literal('builder'), v.literal('guard'), v.literal('laborer'))),
    morale: v.optional(v.number()),
  })
    .index('worldId', ['worldId', 'status'])
    .index('playerId', ['worldId', 'playerId', 'status']),

  settlementEvents: defineTable({
    worldId: v.id('worlds'),
    tick: v.number(),
    type: v.string(),
    summary: v.string(),
    playerId: v.optional(playerId),
    householdId: v.optional(v.id('households')),
    createdAt: v.number(),
  }).index('worldId', ['worldId', 'tick']),

  settlementCycles: defineTable({
    worldId: v.id('worlds'),
    settlementId: v.id('settlements'),
    cycle: v.number(),
    tick: v.number(),
    status: v.union(v.literal('started'), v.literal('completed'), v.literal('failed')),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    resolvedTasks: v.optional(v.number()),
    pendingTasksAfter: v.optional(v.number()),
    summary: v.optional(v.string()),
  }).index('worldId', ['worldId', 'cycle']),
};
