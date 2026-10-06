import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  hookEvents,
  playerItems,
  players,
  pulls,
  purchases,
  setClaims,
  type Player,
} from "@/db/schema";
import {
  BOT_NAMES,
  CRATE_MAP,
  DAILY_COOLDOWN_MS,
  ENERGY_REGEN_MS,
  OFFERS,
  FIRST_PURCHASE_MULT,
  ITEMS,
  ITEM_MAP,
  PACK_MAP,
  PASS_TIERS,
  PASS_UNLOCK_GEMS,
  PASS_XP_PER_TIER,
  RARITIES,
  RARITY_META,
  SETS,
  VIP_TIERS,
  XP_PER_LEVEL,
  vipFor,
  type CrateDef,
  type ItemDef,
  type Rarity,
} from "./config";
import type { GameState, OpenResult, SetState } from "./types";
export type { GameState, OpenResult, SetState } from "./types";


const COOKIE = "cratefall_id";

/* ------------------------------------------------------------- session ---- */

const ADJ = [
  "Lucky",
  "Dusty",
  "Golden",
  "Sneaky",
  "Cursed",
  "Neon",
  "Broke",
  "Mythic",
  "Rusty",
  "Cosmic",
];
const NOUN = [
  "Goblin",
  "Whale",
  "Looter",
  "Crate",
  "Badger",
  "Pigeon",
  "Wizard",
  "Frog",
  "Bandit",
  "Raccoon",
];
const AVATARS = ["🦝", "🐸", "🦊", "🐙", "🦈", "🐲", "🦉", "👾", "🤖", "🐺"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function newName() {
  return `${rand(ADJ)}${rand(NOUN)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function loadPlayer(): Promise<Player | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.token, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function requirePlayer(): Promise<Player> {
  const existing = await loadPlayer();
  if (existing) return existing;

  const token = randomUUID();
  const inserted = await db
    .insert(players)
    .values({ token, name: newName(), avatar: rand(AVATARS) })
    .returning();

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  // starter items so the collection screen isn't empty
  const starters = ITEMS.filter((i) => i.rarity === "common").slice(0, 3);
  await db
    .insert(playerItems)
    .values(starters.map((i) => ({ playerId: inserted[0].id, itemKey: i.key })))
    .onConflictDoNothing();
  await db.insert(hookEvents).values({ playerId: inserted[0].id, hook: "endless" });

  return inserted[0];
}

/* ----------------------------------------------------------------- sync ---- */

const JACKPOT_DECAY_MS = 150_000; // charge bleeds away — come back NOW

export function energyMaxFor(p: Player) {
  return vipFor(p.spentCents).energyMax;
}

export async function syncPlayer(p: Player): Promise<Player> {
  const now = Date.now();
  const max = energyMaxFor(p);
  const elapsed = now - new Date(p.energyUpdatedAt).getTime();
  const regen = p.energy < max ? Math.floor(elapsed / ENERGY_REGEN_MS) : 0;

  const seenElapsed = now - new Date(p.lastSeenAt).getTime();
  const decay = Math.floor(seenElapsed / JACKPOT_DECAY_MS);
  const charge = Math.max(0, p.jackpotCharge - decay);

  const offerExpired =
    p.offerExpiresAt !== null && new Date(p.offerExpiresAt).getTime() < now;

  let energy = Math.min(max, p.energy + regen);
  let streakDays = p.streakDays;
  let streakShields = p.streakShields;

  // streak death: no claim for > 36h burns the streak (loss aversion engine)
  const last = p.lastDailyClaimAt ? new Date(p.lastDailyClaimAt).getTime() : 0;
  if (last && now - last > 36 * 3600_000) {
    if (streakShields > 0) {
      streakShields -= 1;
    } else if (streakDays > 0) {
      streakDays = 0;
    }
  }

  if (
    regen === 0 &&
    decay === 0 &&
    !offerExpired &&
    energy === p.energy &&
    streakDays === p.streakDays &&
    streakShields === p.streakShields
  ) {
    return p;
  }

  const rows = await db
    .update(players)
    .set({
      energy,
      energyUpdatedAt:
        regen > 0
          ? new Date(new Date(p.energyUpdatedAt).getTime() + regen * ENERGY_REGEN_MS)
          : p.energyUpdatedAt,
      jackpotCharge: charge,
      lastSeenAt: new Date(),
      streakDays,
      streakShields,
      offerKey: offerExpired ? null : p.offerKey,
      offerExpiresAt: offerExpired ? null : p.offerExpiresAt,
    })
    .where(eq(players.id, p.id))
    .returning();
  return rows[0] ?? p;
}

export async function logHook(playerId: number, hook: string, weight = 1) {
  await db.insert(hookEvents).values({ playerId, hook, weight });
}

/* ----------------------------------------------------------------- rolls --- */

function applyFloor(crate: CrateDef, boost: number): Array<[Rarity, number]> {
  const floorIdx = crate.floor ? RARITIES.indexOf(crate.floor) : -1;
  const entries = RARITIES.flatMap((r) => {
    const w = crate.weights[r];
    if (!w) return [];
    if (floorIdx >= 0 && RARITIES.indexOf(r) < floorIdx) return [];
    let weight = w;
    if (boost > 0 && (r === "mythic" || r === "legendary")) {
      weight = w * (1 + boost * (r === "mythic" ? 2.2 : 1.4));
    }
    return [[r, weight] as [Rarity, number]];
  });
  return entries;
}

function rollRarity(
  crate: CrateDef,
  boost: number,
  jackpotReady: boolean,
): Rarity {
  if (jackpotReady) {
    return Math.random() < 0.14
      ? "mythic"
      : Math.random() < 0.62
        ? "legendary"
        : "epic";
  }
  const entries = applyFloor(crate, boost);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let t = Math.random() * total;
  for (const [r, w] of entries) {
    t -= w;
    if (t <= 0) return r;
  }
  return entries[0][0];
}

/** Bias drops toward sets the player is closest to completing. Pure pain. */
function pickItem(rarity: Rarity, owned: Set<string>): ItemDef {
  const pool = ITEMS.filter((i) => i.rarity === rarity);
  const byClosestSet = new Map<string, number>();
  for (const s of SETS) {
    const all = ITEMS.filter((i) => i.set === s.key);
    const missing = all.filter((i) => !owned.has(i.key)).length;
    byClosestSet.set(s.key, missing);
  }
  const sorted = [...byClosestSet.entries()].sort((a, b) => a[1] - b[1]);
  const target = Math.random() < 0.62 ? sorted[Math.floor(Math.random() * 2)][0] : null;
  const sub = target ? pool.filter((i) => i.set === target) : [];
  const chosen = sub.length ? rand(sub) : rand(pool);
  return chosen;
}

/* ---------------------------------------------------------------- state ---- */

function playerScore(p: Player, inv: Array<{ itemKey: string; count: number }>) {
  let s = p.level * 40 + p.cratesOpened * 3 + Math.floor(p.spentCents / 100) * 12;
  for (const row of inv) {
    const item = ITEM_MAP[row.itemKey];
    if (item) s += RARITY_META[item.rarity].score * row.count;
  }
  return s;
}

function buildLeaderboard(p: Player, score: number) {
  const vip = vipFor(p.spentCents);
  const bucket = Math.floor(Date.now() / 45_000);
  const bots = BOT_NAMES.slice(0, 9).map((name, i) => {
    const jitter = (((bucket * 7919 + i * 104729) % 1000) / 1000 - 0.5) * 0.18;
    const factor = 1.62 - i * 0.19 + jitter;
    const botScore = Math.max(40, Math.round(score * factor + 120 - i * 8));
    const botVip = VIP_TIERS[Math.min(VIP_TIERS.length - 1, 1 + (i % 4))];
    return {
      name,
      avatar: AVATARS[i % AVATARS.length],
      score: botScore,
      isYou: false,
      vip: botVip.name,
    };
  });
  const all = [
    ...bots,
    { name: p.name, avatar: p.avatar, score, isYou: true, vip: vip.name },
  ];
  all.sort((a, b) => b.score - a.score);
  return all;
}

function buildFeed(p: Player, mine: Array<typeof pulls.$inferSelect>) {
  const now = Date.now();
  const own = mine.map((row) => ({
    id: `u${row.id}`,
    name: row.playerName,
    avatar: p.avatar,
    itemKey: row.itemKey,
    emoji: ITEM_MAP[row.itemKey]?.emoji ?? "❓",
    rarity: row.rarity as Rarity,
    crateKey: row.crateKey,
    isYou: true,
    msAgo: now - new Date(row.createdAt).getTime(),
  }));

  const synthetic: GameState["feed"] = [];
  for (let i = 0; i < 10; i++) {
    // weighted toward flashy results — the envy engine
    const roll = Math.random();
    const rarity: Rarity =
      roll > 0.86
        ? "mythic"
        : roll > 0.6
          ? "legendary"
          : roll > 0.3
            ? "epic"
            : "rare";
    const item = rand(ITEMS.filter((it) => it.rarity === rarity));
    synthetic.push({
      id: `b${i}-${Math.floor(now / 20000)}-${i}`,
      name: rand(BOT_NAMES),
      avatar: rand(AVATARS),
      itemKey: item.key,
      emoji: item.emoji,
      rarity,
      crateKey: rand(Object.keys(CRATE_MAP)),
      isYou: false,
      msAgo: Math.floor(Math.random() * 90_000) + i * 4200,
    });
  }
  return [...own, ...synthetic]
    .sort((a, b) => a.msAgo - b.msAgo)
    .slice(0, 16);
}

export async function buildState(p: Player): Promise<GameState> {
  const [inv, myPulls, claims, hookRows, recentBuys] = await Promise.all([
    db.select().from(playerItems).where(eq(playerItems.playerId, p.id)),
    db
      .select()
      .from(pulls)
      .where(eq(pulls.playerId, p.id))
      .orderBy(desc(pulls.id))
      .limit(8),
    db.select().from(setClaims).where(eq(setClaims.playerId, p.id)),
    db
      .select({
        hook: hookEvents.hook,
        count: sql<number>`count(*)::int`,
        weight: sql<number>`coalesce(sum(${hookEvents.weight}),0)::int`,
      })
      .from(hookEvents)
      .where(eq(hookEvents.playerId, p.id))
      .groupBy(hookEvents.hook),
    db
      .select()
      .from(purchases)
      .where(eq(purchases.playerId, p.id))
      .orderBy(desc(purchases.id))
      .limit(6),
  ]);

  const ownedMap = new Map(inv.map((r) => [r.itemKey, r.count]));
  const ownedSet = new Set(ownedMap.keys());

  const sets: SetState[] = SETS.map((s) => {
    const items = ITEMS.filter((i) => i.set === s.key);
    const owned = items.filter((i) => ownedSet.has(i.key)).length;
    return {
      key: s.key,
      name: s.name,
      emoji: s.emoji,
      total: items.length,
      owned,
      complete: owned === items.length,
      claimed: claims.some((c) => c.setKey === s.key),
      rewardGems: s.rewardGems,
      rewardDust: s.rewardDust,
      permanentBonus: s.permanentBonus,
      items: items.map((i) => ({
        key: i.key,
        name: i.name,
        emoji: i.emoji,
        rarity: i.rarity,
        blurb: i.blurb,
        count: ownedMap.get(i.key) ?? 0,
      })),
    };
  });

  const vip = vipFor(p.spentCents);
  const nextVip = VIP_TIERS.find((t) => t.minCents > p.spentCents) ?? null;
  const totalItems = ITEMS.length;
  const collected = inv.length;
  const level = p.level;
  const score = playerScore(p, inv);
  const now = Date.now();

  const dailyReadyIn = p.lastDailyClaimAt
    ? Math.max(
        0,
        new Date(p.lastDailyClaimAt).getTime() + DAILY_COOLDOWN_MS - now,
      )
    : null;

  const energyMax = vip.energyMax;
  const energyMsToNext =
    p.energy >= energyMax
      ? 0
      : Math.max(
          0,
          ENERGY_REGEN_MS -
            (now - new Date(p.energyUpdatedAt).getTime()) % ENERGY_REGEN_MS,
        );

  const offerDef = p.offerKey
    ? OFFER_MAP[p.offerKey]
    : null;
  const msLeft = p.offerExpiresAt
    ? Math.max(0, new Date(p.offerExpiresAt).getTime() - now)
    : 0;

  return {
    me: {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      gems: p.gems,
      coins: p.coins,
      dust: p.dust,
      keys: p.keys,
      energy: p.energy,
      energyMax,
      energyMsToNext,
      streakDays: p.streakDays,
      bestStreak: Math.max(p.bestStreak, p.streakDays),
      streakShields: p.streakShields,
      dailyReadyIn: p.lastDailyClaimAt ? dailyReadyIn : 0,
      level,
      xp: p.xp,
      xpNeeded: XP_PER_LEVEL,
      passXp: p.passXp,
      passTier: Math.floor(p.passXp / PASS_XP_PER_TIER),
      passProgress: (p.passXp % PASS_XP_PER_TIER) / PASS_XP_PER_TIER,
      premiumPass: p.premiumPass,
      passClaimed: p.passClaimed ?? [],
      jackpotCharge: p.jackpotCharge,
      jackpotReady: p.jackpotCharge >= 100,
      spentCents: p.spentCents,
      purchaseCount: p.purchaseCount,
      firstPurchaseBonusUsed: p.firstPurchaseBonusUsed,
      cratesOpened: p.cratesOpened,
      mythics: p.mythicsPulled,
      legendaries: p.legendariesPulled,
      score,
      vip,
      nextVip,
      nextVipGap: nextVip ? nextVip.minCents - p.spentCents : 0,
      collectionPct: Math.round((collected / totalItems) * 1000) / 10,
      createdAt: new Date(p.createdAt).toISOString(),
    },
    inventory: inv.map((r) => ({ key: r.itemKey, count: r.count })),
    sets,
    offer:
      offerDef && msLeft > 0
        ? {
            key: offerDef.key,
            headline: offerDef.headline,
            sub: offerDef.sub,
            priceCents: offerDef.priceCents,
            gems: offerDef.gems,
            keys: offerDef.keys,
            claimedPct: offerDef.claimedPct,
            emoji: offerDef.emoji,
            accent: offerDef.accent,
            msLeft,
          }
        : null,
    feed: buildFeed(p, myPulls),
    leaderboard: buildLeaderboard(p, score),
    hooks: hookRows.sort((a, b) => b.weight - a.weight),
    recentPurchases: recentBuys.map((b) => ({
      packKey: b.packKey,
      priceCents: b.priceCents,
      gems: b.gems,
      at: new Date(b.createdAt).toISOString(),
    })),
  };
}

/* -------------------------------------------------------------- actions ---- */

export async function openCrates(
  p: Player,
  crateKey: string,
  count: number,
): Promise<{ ok: true; result: OpenResult } | { ok: false; error: string }> {
  const crate = CRATE_MAP[crateKey];
  if (!crate) return { ok: false, error: "Unknown crate." };

  const vip = vipFor(p.spentCents);
  const discount = count >= 10 ? 0.9 : 1;

  const costEnergy = (crate.energy ?? 0) * count;
  const costGems = Math.round((crate.gems ?? 0) * count * discount);
  const costKeys = (crate.keys ?? 0) * count;
  const costCoins = (crate.coins ?? 0) * count;

  if (costEnergy > p.energy)
    return {
      ok: false,
      error: `Need ${costEnergy} ⚡ — you have ${p.energy}. Wait ${Math.ceil(
        (costEnergy - p.energy) * (ENERGY_REGEN_MS / 1000),
      )}s, or... you know.`,
    };
  if (costGems > p.gems)
    return { ok: false, error: `Need ${costGems.toLocaleString()} 💎.` };
  if (costKeys > p.keys) return { ok: false, error: `Need ${costKeys} 🗝️.` };
  if (costCoins > p.coins) return { ok: false, error: `Need ${costCoins} 🪙.` };

  const inv = await db
    .select()
    .from(playerItems)
    .where(eq(playerItems.playerId, p.id));
  const owned = new Set(inv.map((r) => r.itemKey));

  const results: OpenResult["pulls"] = [];
  let jackpotFired = false;
  let dustGain = 0;
  let coinGain = 0;
  let charge = p.jackpotCharge;
  const pullsToInsert: Array<typeof pulls.$inferInsert> = [];

  for (let i = 0; i < count; i++) {
    const ready = charge >= 100;
    const rarity = rollRarity(crate, vip.oddsBoost, ready);
    const item = pickItem(rarity, owned);
    const dupe = owned.has(item.key);
    const meta = RARITY_META[rarity];
    const dust = dupe ? meta.dust : 0;
    const coins = Math.round(meta.dust * 0.8 + 12);
    dustGain += dust;
    coinGain += coins;
    owned.add(item.key);
    charge = ready ? 0 : Math.min(100, charge + crate.jackpot);
    if (ready) jackpotFired = true;

    results.push({
      itemKey: item.key,
      name: item.name,
      emoji: item.emoji,
      rarity,
      set: item.set,
      duplicate: dupe,
      dust,
      coins,
    });
    pullsToInsert.push({
      playerId: p.id,
      playerName: p.name,
      itemKey: item.key,
      crateKey: crate.key,
      rarity,
    });
  }

  const xpGain = count * 18;
  const newXp = p.xp + xpGain;
  const newLevel = 1 + Math.floor(newXp / XP_PER_LEVEL);
  const levelUp = newLevel > p.level;

  const updated = await db
    .update(players)
    .set({
      energy: p.energy - costEnergy,
      gems: p.gems - costGems,
      keys: p.keys - costKeys,
      coins: p.coins - costCoins + coinGain,
      dust: p.dust + dustGain,
      xp: newXp,
      level: newLevel,
      passXp: p.passXp + count * 26,
      jackpotCharge: charge,
      cratesOpened: p.cratesOpened + count,
      mythicsPulled:
        p.mythicsPulled + results.filter((r) => r.rarity === "mythic").length,
      legendariesPulled:
        p.legendariesPulled +
        results.filter((r) => r.rarity === "legendary").length,
      lastSeenAt: new Date(),
      energyUpdatedAt:
        costEnergy > 0 && p.energy - costEnergy < vip.energyMax
          ? new Date()
          : p.energyUpdatedAt,
    })
    .where(eq(players.id, p.id))
    .returning();

  for (const r of results) {
    await db
      .insert(playerItems)
      .values({ playerId: p.id, itemKey: r.itemKey, count: 1 })
      .onConflictDoUpdate({
        target: [playerItems.playerId, playerItems.itemKey],
        set: { count: sql`${playerItems.count} + 1` },
      });
  }
  if (pullsToInsert.length) await db.insert(pulls).values(pullsToInsert);

  const hookList: Array<[string, number]> = [["variable_reward", count]];
  if (jackpotFired) hookList.push(["near_miss", 3]);
  else if (charge >= 82) hookList.push(["near_miss", 2]);
  const dupeCount = results.filter((r) => r.duplicate).length;
  if (dupeCount > 0) hookList.push(["sunk_cost", dupeCount]);
  hookList.push(["collection", results.length]);
  hookList.push(["gamble", count]);
  if (costGems > 0) hookList.push(["energy_wall", costGems > 300 ? 2 : 1]);
  await db
    .insert(hookEvents)
    .values(hookList.map(([hook, weight]) => ({ playerId: p.id, hook, weight })));

  return {
    ok: true,
    result: {
      pulls: results,
      jackpot: jackpotFired,
      energy: updated[0].energy,
      gems: updated[0].gems,
      coins: updated[0].coins,
      dust: updated[0].dust,
      keys: updated[0].keys,
      xpGain,
      levelUp,
      newLevel,
      jackpotCharge: charge,
    },
  };
}

/* Daily rewards escalate for 7 days, then reset. Classic retention ladder. */
export const DAILY_REWARDS: Array<{
  gems: number;
  coins: number;
  keys: number;
  dust: number;
  label: string;
}> = [
  { gems: 30, coins: 150, keys: 0, dust: 0, label: "30 💎" },
  { gems: 45, coins: 200, keys: 1, dust: 20, label: "45 💎 + 1 🗝️" },
  { gems: 70, coins: 300, keys: 0, dust: 50, label: "70 💎 + dust" },
  { gems: 110, coins: 450, keys: 1, dust: 0, label: "110 💎 + 1 🗝️" },
  { gems: 160, coins: 600, keys: 0, dust: 120, label: "160 💎 + 120 ✨" },
  { gems: 240, coins: 900, keys: 2, dust: 0, label: "240 💎 + 2 🗝️" },
  { gems: 500, coins: 2000, keys: 3, dust: 500, label: "MEGA: 500 💎" },
];

export async function claimDaily(p: Player) {
  const now = new Date();
  const last = p.lastDailyClaimAt ? new Date(p.lastDailyClaimAt) : null;
  if (last) {
    const since = now.getTime() - last.getTime();
    if (since < DAILY_COOLDOWN_MS) {
      return { ok: false as const, error: "Already claimed. Come back soon." };
    }
  }
  const yesterday =
    last !== null && now.getTime() - last.getTime() < 44 * 3600_000;
  const nextStreak = yesterday ? p.streakDays + 1 : 1;
  const dayIdx = Math.min(DAILY_REWARDS.length - 1, (nextStreak - 1) % 7);
  const reward = DAILY_REWARDS[dayIdx];
  const vip = vipFor(p.spentCents);

  const rows = await db
    .update(players)
    .set({
      gems: p.gems + reward.gems + vip.dailyGems,
      coins: p.coins + reward.coins,
      dust: p.dust + reward.dust,
      keys: p.keys + reward.keys,
      streakDays: nextStreak,
      bestStreak: Math.max(p.bestStreak, nextStreak),
      lastDailyClaimAt: now,
      passXp: p.passXp + 120,
      lastSeenAt: now,
    })
    .where(eq(players.id, p.id))
    .returning();

  await logHook(p.id, "loss_aversion", 2);
  await logHook(p.id, "endless", 1);
  if (vip.dailyGems > 0) await logHook(p.id, "status", 2);

  return {
    ok: true as const,
    reward,
    streak: nextStreak,
    vipDrip: vip.dailyGems,
    player: rows[0],
  };
}

export async function claimSet(p: Player, setKey: string) {
  const set = SETS.find((s) => s.key === setKey);
  if (!set) return { ok: false as const, error: "Unknown set." };

  const inv = await db
    .select()
    .from(playerItems)
    .where(eq(playerItems.playerId, p.id));
  const owned = new Set(inv.map((r) => r.itemKey));
  const items = ITEMS.filter((i) => i.set === setKey);
  if (items.some((i) => !owned.has(i.key)))
    return { ok: false as const, error: "Set incomplete." };

  const existing = await db
    .select()
    .from(setClaims)
    .where(and(eq(setClaims.playerId, p.id), eq(setClaims.setKey, setKey)))
    .limit(1);
  if (existing.length) return { ok: false as const, error: "Already claimed." };

  await db
    .insert(setClaims)
    .values({ playerId: p.id, setKey })
    .onConflictDoNothing();
  const rows = await db
    .update(players)
    .set({
      gems: p.gems + set.rewardGems,
      dust: p.dust + set.rewardDust,
      passXp: p.passXp + 300,
      lastSeenAt: new Date(),
    })
    .where(eq(players.id, p.id))
    .returning();

  await logHook(p.id, "collection", 4);
  await logHook(p.id, "sunk_cost", 3);

  return { ok: true as const, set, player: rows[0] };
}

export async function craftItem(p: Player, itemKey: string) {
  const item = ITEM_MAP[itemKey];
  if (!item) return { ok: false as const, error: "Unknown item." };
  const cost = RARITY_META[item.rarity].dust * 7;
  if (p.dust < cost)
    return {
      ok: false as const,
      error: `Need ${cost.toLocaleString()} ✨ — you have ${p.dust.toLocaleString()}.`,
    };
  const rows = await db
    .update(players)
    .set({ dust: p.dust - cost, lastSeenAt: new Date() })
    .where(eq(players.id, p.id))
    .returning();
  await db
    .insert(playerItems)
    .values({ playerId: p.id, itemKey })
    .onConflictDoUpdate({
      target: [playerItems.playerId, playerItems.itemKey],
      set: { count: sql`${playerItems.count} + 1` },
    });
  await logHook(p.id, "sunk_cost", 3);
  return { ok: true as const, item, cost, player: rows[0] };
}

export async function claimPassTier(p: Player, tier: number) {
  const def = PASS_TIERS.find((t) => t.tier === tier);
  if (!def) return { ok: false as const, error: "Unknown tier." };
  if (p.passXp < tier * PASS_XP_PER_TIER)
    return { ok: false as const, error: "Tier not reached." };
  const claimed = p.passClaimed ?? [];
  if (claimed.includes(tier))
    return { ok: false as const, error: "Already claimed." };
  if (!p.premiumPass)
    return { ok: false as const, error: "Premium track is locked." };

  const reward = def.premium;
  const rows = await db
    .update(players)
    .set({
      gems: p.gems + (reward.kind === "gems" ? reward.amount : 0),
      coins: p.coins + (reward.kind === "coins" ? reward.amount : 0),
      dust: p.dust + (reward.kind === "dust" ? reward.amount : 0),
      keys: p.keys + (reward.kind === "keys" ? reward.amount : 0),
      passClaimed: [...claimed, tier],
      lastSeenAt: new Date(),
    })
    .where(eq(players.id, p.id))
    .returning();
  await logHook(p.id, "endless", 2);
  return { ok: true as const, reward, player: rows[0] };
}

export async function unlockPass(p: Player) {
  if (p.premiumPass) return { ok: false as const, error: "Already unlocked." };
  if (p.gems < PASS_UNLOCK_GEMS)
    return { ok: false as const, error: `Need ${PASS_UNLOCK_GEMS} 💎.` };
  const rows = await db
    .update(players)
    .set({
      gems: p.gems - PASS_UNLOCK_GEMS,
      premiumPass: true,
      lastSeenAt: new Date(),
    })
    .where(eq(players.id, p.id))
    .returning();
  await logHook(p.id, "sunk_cost", 5);
  return { ok: true as const, player: rows[0] };
}

/* Simulated purchase. No payment processor is ever contacted. */
export async function buyPack(p: Player, packKey: string) {
  const pack = PACK_MAP[packKey];
  if (!pack) return { ok: false as const, error: "Unknown pack." };

  const doubled = !p.firstPurchaseBonusUsed;
  const gems = Math.round(pack.gems * (doubled ? FIRST_PURCHASE_MULT : 1));

  const rows = await db
    .update(players)
    .set({
      gems: p.gems + gems,
      keys: p.keys + pack.keys,
      spentCents: p.spentCents + pack.priceCents,
      purchaseCount: p.purchaseCount + 1,
      firstPurchaseBonusUsed: true,
      energy: Math.min(
        vipFor(p.spentCents + pack.priceCents).energyMax,
        p.energy + 10,
      ),
      lastSeenAt: new Date(),
    })
    .where(eq(players.id, p.id))
    .returning();

  await db.insert(purchases).values({
    playerId: p.id,
    packKey: pack.key,
    priceCents: pack.priceCents,
    gems,
  });
  await logHook(p.id, "gamble", 4);
  await logHook(p.id, "status", 3);
  if (doubled) await logHook(p.id, "urgency", 3);

  return { ok: true as const, pack, gems, doubled, player: rows[0] };
}

export async function buyOffer(p: Player, offerKey: string) {
  const offer = OFFER_MAP[offerKey];
  if (!offer) return { ok: false as const, error: "Unknown offer." };
  if (p.offerKey !== offerKey)
    return { ok: false as const, error: "Offer expired." };

  const rows = await db
    .update(players)
    .set({
      gems: p.gems + offer.gems,
      keys: p.keys + offer.keys,
      spentCents: p.spentCents + offer.priceCents,
      purchaseCount: p.purchaseCount + 1,
      firstPurchaseBonusUsed: true,
      energy: Math.min(
        vipFor(p.spentCents + offer.priceCents).energyMax,
        p.energy + 12,
      ),
      offerKey: null,
      offerExpiresAt: null,
      lastSeenAt: new Date(),
    })
    .where(eq(players.id, p.id))
    .returning();

  await db.insert(purchases).values({
    playerId: p.id,
    packKey: `offer:${offer.key}`,
    priceCents: offer.priceCents,
    gems: offer.gems,
  });
  await logHook(p.id, "urgency", 6);
  await logHook(p.id, "near_miss", 3);
  return { ok: true as const, offer, player: rows[0] };
}

/** Rolls the next manipulative offer based on the player's weakest moment. */
export function chooseOffer(p: Player, energyMax: number) {
  const candidates = OFFERS.filter((o) => o.key !== p.offerKey);
  if (p.jackpotCharge >= 80)
    return candidates.find((o) => o.key === "mythic_surge") ?? candidates[0];
  if (p.energy <= 2)
    return candidates.find((o) => o.key === "comeback") ?? candidates[0];
  if (p.streakDays >= 3)
    return candidates.find((o) => o.key === "streak_saver") ?? candidates[0];
  if (p.spentCents >= 2000)
    return candidates.find((o) => o.key === "vip_fast") ?? candidates[0];
  void energyMax;
  return candidates.find((o) => o.key === "flash") ?? candidates[0];
}

export async function maybeSpawnOffer(p: Player): Promise<Player> {
  if (p.offerKey && p.offerExpiresAt && new Date(p.offerExpiresAt).getTime() > Date.now())
    return p;
  // Offers appear often enough to always feel like "right now".
  const shouldSpawn = Math.random() < 0.85;
  if (!shouldSpawn) return p;
  const offer = chooseOffer(p, energyMaxFor(p));
  const rows = await db
    .update(players)
    .set({
      offerKey: offer.key,
      offerExpiresAt: new Date(Date.now() + offer.minutes * 60_000),
    })
    .where(eq(players.id, p.id))
    .returning();
  await logHook(p.id, "urgency", 1);
  return rows[0] ?? p;
}

const OFFER_MAP: Record<string, (typeof OFFERS)[number]> = Object.fromEntries(
  OFFERS.map((o) => [o.key, o]),
);
