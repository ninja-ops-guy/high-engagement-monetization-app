import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * CRATEFALL — simulated free-to-play economy.
 * No real money is ever charged. "Spending" is tracked in fake USD so the
 * player can see exactly how much these mechanics would have cost them.
 */
export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar").notNull().default("🦝"),

    // currencies
    gems: integer("gems").notNull().default(300),
    coins: integer("coins").notNull().default(250),
    dust: integer("dust").notNull().default(0),
    keys: integer("keys").notNull().default(3),

    // energy / lives (the retention gate)
    energy: integer("energy").notNull().default(20),
    energyUpdatedAt: timestamp("energy_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // retention
    streakDays: integer("streak_days").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastDailyClaimAt: timestamp("last_daily_claim_at", { withTimezone: true }),
    shieldsUsed: integer("shields_used").notNull().default(0),
    streakShields: integer("streak_shields").notNull().default(1),

    // progression
    level: integer("level").notNull().default(1),
    xp: integer("xp").notNull().default(0),
    passXp: integer("pass_xp").notNull().default(0),
    premiumPass: boolean("premium_pass").notNull().default(false),
    passClaimed: jsonb("pass_claimed").$type<number[]>().notNull().default([]),

    // the jackpot meter (near-miss engine)
    jackpotCharge: integer("jackpot_charge").notNull().default(0),

    // simulated wallet
    spentCents: integer("spent_cents").notNull().default(0),
    purchaseCount: integer("purchase_count").notNull().default(0),
    firstPurchaseBonusUsed: boolean("first_purchase_bonus_used")
      .notNull()
      .default(false),

    // live limited-time offer state
    offerKey: text("offer_key"),
    offerExpiresAt: timestamp("offer_expires_at", { withTimezone: true }),

    // stats
    cratesOpened: integer("crates_opened").notNull().default(0),
    mythicsPulled: integer("mythics_pulled").notNull().default(0),
    legendariesPulled: integer("legendaries_pulled").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("players_token_idx").on(table.token)],
);

/** Static-ish item catalogue lives in code; ownership lives here. */
export const playerItems = pgTable(
  "player_items",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("player_items_unique_idx").on(table.playerId, table.itemKey),
  ],
);

/** Every pull, for the global feed + the "near miss" display. */
export const pulls = pgTable(
  "pulls",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    playerName: text("player_name").notNull(),
    itemKey: text("item_key").notNull(),
    crateKey: text("crate_key").notNull(),
    rarity: text("rarity").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("pulls_created_idx").on(table.createdAt)],
);

/** Simulated storefront transactions. */
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  packKey: text("pack_key").notNull(),
  priceCents: integer("price_cents").notNull(),
  gems: integer("gems").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Dark-pattern telemetry. Every time a hook fires we log it so the player can
 * later see, in numbers, exactly which levers were pulled on them.
 */
export const hookEvents = pgTable(
  "hook_events",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    hook: text("hook").notNull(),
    weight: integer("weight").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hook_events_player_idx").on(table.playerId, table.hook)],
);

/** Completed-set reward claims. */
export const setClaims = pgTable(
  "set_claims",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    setKey: text("set_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("set_claims_unique_idx").on(table.playerId, table.setKey),
  ],
);

export type Player = typeof players.$inferSelect;
export type PlayerItem = typeof playerItems.$inferSelect;
export type Pull = typeof pulls.$inferSelect;
