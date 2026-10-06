/* CRATEFALL game data. Pure config — safe to import on client or server. */

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITIES: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export const RARITY_META: Record<
  Rarity,
  {
    label: string;
    color: string;
    glow: string;
    text: string;
    border: string;
    ring: string;
    dust: number;
    score: number;
  }
> = {
  common: {
    label: "Common",
    color: "#7b8794",
    glow: "rgba(123,135,148,0.55)",
    text: "text-slate-300",
    border: "border-slate-500/40",
    ring: "shadow-[0_0_18px_rgba(123,135,148,0.35)]",
    dust: 5,
    score: 1,
  },
  rare: {
    label: "Rare",
    color: "#3ea6ff",
    glow: "rgba(62,166,255,0.6)",
    text: "text-sky-300",
    border: "border-sky-400/50",
    ring: "shadow-[0_0_22px_rgba(62,166,255,0.5)]",
    dust: 15,
    score: 4,
  },
  epic: {
    label: "Epic",
    color: "#b06bff",
    glow: "rgba(176,107,255,0.65)",
    text: "text-fuchsia-300",
    border: "border-fuchsia-400/50",
    ring: "shadow-[0_0_26px_rgba(176,107,255,0.55)]",
    dust: 45,
    score: 12,
  },
  legendary: {
    label: "Legendary",
    color: "#ffb02e",
    glow: "rgba(255,176,46,0.75)",
    text: "text-amber-300",
    border: "border-amber-400/60",
    ring: "shadow-[0_0_32px_rgba(255,176,46,0.65)]",
    dust: 140,
    score: 40,
  },
  mythic: {
    label: "MYTHIC",
    color: "#ff4d6d",
    glow: "rgba(255,77,109,0.85)",
    text: "text-rose-300",
    border: "border-rose-400/70",
    ring: "shadow-[0_0_42px_rgba(255,77,109,0.8)]",
    dust: 500,
    score: 150,
  },
};

export type ItemDef = {
  key: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  set: string;
  blurb: string;
};

export type SetDef = {
  key: string;
  name: string;
  emoji: string;
  rewardGems: number;
  rewardDust: number;
  permanentBonus: number;
};

export const SETS: SetDef[] = [
  {
    key: "goblin",
    name: "Goblin Hoard",
    emoji: "🪙",
    rewardGems: 150,
    rewardDust: 120,
    permanentBonus: 2,
  },
  {
    key: "crypt",
    name: "Sunken Crypt",
    emoji: "🪦",
    rewardGems: 400,
    rewardDust: 300,
    permanentBonus: 5,
  },
  {
    key: "forge",
    name: "Emberforge",
    emoji: "🔥",
    rewardGems: 900,
    rewardDust: 600,
    permanentBonus: 9,
  },
  {
    key: "frost",
    name: "Frostspire",
    emoji: "❄️",
    rewardGems: 1800,
    rewardDust: 1200,
    permanentBonus: 14,
  },
  {
    key: "void",
    name: "Void Market",
    emoji: "🕳️",
    rewardGems: 4000,
    rewardDust: 2500,
    permanentBonus: 22,
  },
  {
    key: "celestial",
    name: "Celestial Vault",
    emoji: "🌠",
    rewardGems: 12000,
    rewardDust: 6000,
    permanentBonus: 40,
  },
];

const RAW_ITEMS: Array<[string, string, Rarity, string, string, string]> = [
  // name, emoji, rarity, set, key, blurb
  ["Bent Coin", "🪙", "common", "goblin", "goblin_coin", "Slightly sticky."],
  ["Goblin Sock", "🧦", "common", "goblin", "goblin_sock", "Do not sniff."],
  ["Chipped Dagger", "🔪", "rare", "goblin", "goblin_dagger", "Shanks on a budget."],
  ["Hoard Ledger", "📜", "epic", "goblin", "goblin_ledger", "Debts, mostly yours."],
  ["Crown of Greed", "👑", "legendary", "goblin", "goblin_crown", "Heavy is the head."],
  ["Midas Fingernail", "💅", "mythic", "goblin", "goblin_midas", "0.02% drop rate."],

  ["Rusted Anchor", "⚓", "common", "crypt", "crypt_anchor", "It remembers water."],
  ["Barnacle Cup", "🥤", "rare", "crypt", "crypt_cup", "Still dripping."],
  ["Drowned Bell", "🔔", "epic", "crypt", "crypt_bell", "Rings underwater only."],
  ["Cursed Compass", "🧭", "legendary", "crypt", "crypt_compass", "Points at your wallet."],
  ["Bone Skiff", "🛶", "rare", "crypt", "crypt_skiff", "Rowed by no one."],
  ["Leviathan Pearl", "🫧", "mythic", "crypt", "crypt_pearl", "Hums when observed."],

  ["Cinder Brick", "🧱", "common", "forge", "forge_brick", "Warm for centuries."],
  ["Ember Tong", "🥄", "common", "forge", "forge_tong", "Flips mythic steaks."],
  ["Slag Hammer", "🔨", "rare", "forge", "forge_hammer", "Dents regret."],
  ["Molten Gauntlet", "🧤", "epic", "forge", "forge_gauntlet", "One size: burning."],
  ["Phoenix Rivet", "🔩", "legendary", "forge", "forge_rivet", "Reborn every boot."],
  ["Heart of the Forge", "❤️‍🔥", "mythic", "forge", "forge_heart", "Beats 120 BPM forever."],

  ["Icicle Shard", "🧊", "common", "frost", "frost_shard", "Melts, betrays."],
  ["Frozen Mitten", "🧤", "rare", "frost", "frost_mitten", "Left hand only."],
  ["Rime Lantern", "🏮", "rare", "frost", "frost_lantern", "Casts cold light."],
  ["Glacier Key", "🗝️", "epic", "frost", "frost_key", "Opens nothing. Yet."],
  ["Winter Sovereign Cloak", "🧣", "legendary", "frost", "frost_cloak", "Billows indoors."],
  ["Absolute Zero", "🥶", "mythic", "frost", "frost_zero", "Stops the animation."],

  ["Void Pocket Lint", "🌫️", "common", "void", "void_lint", "From nowhere."],
  ["Null Candle", "🕯️", "common", "void", "void_candle", "Emits darkness."],
  ["Echo Shard", "🔮", "rare", "void", "void_echo", "Repeats your pull."],
  ["Inverse Coin", "🙃", "epic", "void", "void_coin", "Always lands sideways."],
  ["Market Maker's Quill", "🖋️", "legendary", "void", "void_quill", "Writes the odds."],
  ["The Margin", "📉", "mythic", "void", "void_margin", "The house always wins."],

  ["Star Dust Speck", "✨", "common", "celestial", "cel_speck", "Barely a star."],
  ["Comet Fragment", "☄️", "rare", "celestial", "cel_comet", "Still slightly warm."],
  ["Nebula Jar", "🫙", "epic", "celestial", "cel_jar", "Shake gently."],
  ["Orbital Halo", "😇", "epic", "celestial", "cel_halo", "Spins on command."],
  ["Sunforge Sigil", "🌞", "legendary", "celestial", "cel_sigil", "Blinding in photos."],
  ["Event Horizon", "🕳️", "mythic", "celestial", "cel_horizon", "Contains the rest."],
  ["Genesis Shard", "🌈", "mythic", "celestial", "cel_genesis", "One per universe."],
];

export const ITEMS: ItemDef[] = RAW_ITEMS.map(
  ([name, emoji, rarity, set, key, blurb]) => ({
    key,
    name,
    emoji,
    rarity,
    set,
    blurb,
  }),
);

export const ITEM_MAP: Record<string, ItemDef> = Object.fromEntries(
  ITEMS.map((i) => [i.key, i]),
);

/* ------------------------------------------------------------------ crates */

export type CrateDef = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  accent: string;
  energy?: number;
  gems?: number;
  coins?: number;
  keys?: number;
  weights: Partial<Record<Rarity, number>>;
  floor?: Rarity;
  jackpot: number;
  pity?: number;
  hot?: boolean;
};

const TOTAL_WEIGHT = (c: CrateDef) =>
  Object.values(c.weights).reduce((a, b) => a + (b ?? 0), 0);

export const CRATES: CrateDef[] = [
  {
    key: "scrap",
    name: "Scrap Crate",
    emoji: "📦",
    tagline: "Free-ish. Mostly lint.",
    accent: "#8b9bb0",
    energy: 1,
    weights: { common: 82, rare: 15, epic: 2.7, legendary: 0.3 },
    jackpot: 3,
  },
  {
    key: "silver",
    name: "Silver Crate",
    emoji: "🎁",
    tagline: "Guaranteed Rare or better.",
    accent: "#9fd8ff",
    energy: 3,
    weights: { common: 45, rare: 40, epic: 12, legendary: 3, mythic: 0.05 },
    floor: "rare",
    jackpot: 5,
  },
  {
    key: "gold",
    name: "Golden Crate",
    emoji: "🧰",
    tagline: "Epic odds up 6×.",
    accent: "#ffce4d",
    gems: 60,
    weights: { common: 20, rare: 44, epic: 27, legendary: 8, mythic: 0.35 },
    jackpot: 8,
  },
  {
    key: "vault",
    name: "Vault Crate",
    emoji: "🗝️",
    tagline: "Keys only. Cannot be bought.",
    accent: "#6ef2c0",
    keys: 1,
    weights: { rare: 42, epic: 40, legendary: 16, mythic: 1.4 },
    floor: "rare",
    jackpot: 10,
  },
  {
    key: "obsidian",
    name: "Obsidian Crate",
    emoji: "🌑",
    tagline: "Legendary floor at 100 charge.",
    accent: "#c08bff",
    gems: 200,
    weights: { rare: 26, epic: 48, legendary: 22, mythic: 3.2 },
    floor: "epic",
    jackpot: 12,
    hot: true,
  },
  {
    key: "celestial",
    name: "Celestial Crate",
    emoji: "🌠",
    tagline: "Best odds. 8.5% MYTHIC.",
    accent: "#ff6b9d",
    gems: 520,
    weights: { epic: 41, legendary: 48, mythic: 8.5 },
    floor: "epic",
    jackpot: 18,
  },
];

export const CRATE_MAP: Record<string, CrateDef> = Object.fromEntries(
  CRATES.map((c) => [c.key, c]),
);

export function crateOdds(crate: CrateDef): Array<{ rarity: Rarity; pct: number }> {
  const total = TOTAL_WEIGHT(crate);
  return RARITIES.filter((r) => (crate.weights[r] ?? 0) > 0).map((r) => ({
    rarity: r,
    pct: ((crate.weights[r] ?? 0) / total) * 100,
  }));
}

export function cratePriceLabel(crate: CrateDef): string {
  if (crate.energy) return `${crate.energy} ⚡`;
  if (crate.keys) return `${crate.keys} 🗝️`;
  if (crate.coins) return `${crate.coins.toLocaleString()} 🪙`;
  return `${crate.gems?.toLocaleString()} 💎`;
}

/* ------------------------------------------------------------------- packs */

export type PackDef = {
  key: string;
  name: string;
  priceCents: number;
  gems: number;
  keys: number;
  bonusPct: number;
  badge?: string;
  popular?: boolean;
  accent: string;
  emoji: string;
};

export const PACKS: PackDef[] = [
  {
    key: "starter",
    name: "Pocket Pouch",
    priceCents: 99,
    gems: 130,
    keys: 0,
    bonusPct: 0,
    accent: "#7dd3fc",
    emoji: "🎀",
  },
  {
    key: "stack",
    name: "Gem Stack",
    priceCents: 499,
    gems: 700,
    keys: 1,
    bonusPct: 8,
    accent: "#a78bfa",
    emoji: "💠",
  },
  {
    key: "crateful",
    name: "Crateful",
    priceCents: 1999,
    gems: 2900,
    keys: 4,
    bonusPct: 20,
    badge: "BEST VALUE",
    popular: true,
    accent: "#fbbf24",
    emoji: "🧳",
  },
  {
    key: "obsidian",
    name: "Obsidian Trunk",
    priceCents: 4999,
    gems: 7600,
    keys: 12,
    bonusPct: 35,
    badge: "MOST POPULAR",
    accent: "#f472b6",
    emoji: "🗃️",
  },
  {
    key: "vault",
    name: "The Entire Vault",
    priceCents: 9999,
    gems: 17500,
    keys: 40,
    bonusPct: 55,
    badge: "WHALE TIER",
    accent: "#ff4d6d",
    emoji: "🏦",
  },
];

export const PACK_MAP: Record<string, PackDef> = Object.fromEntries(
  PACKS.map((p) => [p.key, p]),
);

export const FIRST_PURCHASE_MULT = 2;

/* ------------------------------------------------------------------ offers */

export type OfferDef = {
  key: string;
  name: string;
  priceCents: number;
  gems: number;
  keys: number;
  minutes: number;
  hook: string;
  headline: string;
  sub: string;
  claimedPct: number;
  emoji: string;
  accent: string;
};

export const OFFERS: OfferDef[] = [
  {
    key: "flash",
    name: "Flash Vault",
    priceCents: 299,
    gems: 900,
    keys: 2,
    minutes: 20,
    hook: "urgency",
    headline: "⚡ FLASH VAULT — 900 💎 for $2.99",
    sub: "73% cheaper than normal. 18 minutes. Then it's gone forever.",
    claimedPct: 87,
    emoji: "⚡",
    accent: "#fbbf24",
  },
  {
    key: "mythic_surge",
    name: "Mythic Surge",
    priceCents: 499,
    gems: 1400,
    keys: 3,
    minutes: 15,
    hook: "near_miss",
    headline: "🔥 MYTHIC SURGE — odds ×3",
    sub: "You are 1 pull from a jackpot. Surge lasts 15 minutes only.",
    claimedPct: 94,
    emoji: "🔥",
    accent: "#ff4d6d",
  },
  {
    key: "streak_saver",
    name: "Streak Insurance",
    priceCents: 199,
    gems: 350,
    keys: 0,
    minutes: 30,
    hook: "loss_aversion",
    headline: "🛡️ STREAK INSURANCE",
    sub: "Your 6-day streak dies tonight. 350 💎 + a shield to save it.",
    claimedPct: 78,
    emoji: "🛡️",
    accent: "#38bdf8",
  },
  {
    key: "comeback",
    name: "Recharge Bundle",
    priceCents: 399,
    gems: 1000,
    keys: 2,
    minutes: 25,
    hook: "energy_wall",
    headline: "🔋 INSTANT RECHARGE + 1000 💎",
    sub: "Out of energy? Skip the 25s wait. Forever. For 25 minutes.",
    claimedPct: 91,
    emoji: "🔋",
    accent: "#34d399",
  },
  {
    key: "vip_fast",
    name: "Obsidian Express",
    priceCents: 1499,
    gems: 2200,
    keys: 6,
    minutes: 45,
    hook: "status",
    headline: "👑 OBSIDIAN EXPRESS",
    sub: "Instantly jump to Platinum VIP. Permanently. Obviously.",
    claimedPct: 69,
    emoji: "👑",
    accent: "#c08bff",
  },
];

/* --------------------------------------------------------------- vip ladder */

export type VipTier = {
  key: string;
  name: string;
  minCents: number;
  color: string;
  dailyGems: number;
  energyMax: number;
  oddsBoost: number;
  emoji: string;
  perk: string;
};

export const VIP_TIERS: VipTier[] = [
  {
    key: "bronze",
    name: "Bronze",
    minCents: 0,
    color: "#a8a29e",
    dailyGems: 0,
    energyMax: 20,
    oddsBoost: 0,
    emoji: "🥉",
    perk: "You exist.",
  },
  {
    key: "silver",
    name: "Silver",
    minCents: 500,
    color: "#cbd5e1",
    dailyGems: 25,
    energyMax: 24,
    oddsBoost: 0.02,
    emoji: "🥈",
    perk: "+25 💎 daily drip",
  },
  {
    key: "gold",
    name: "Gold",
    minCents: 2000,
    color: "#fbbf24",
    dailyGems: 80,
    energyMax: 30,
    oddsBoost: 0.05,
    emoji: "🥇",
    perk: "Mythic odds +5%",
  },
  {
    key: "platinum",
    name: "Platinum",
    minCents: 5000,
    color: "#67e8f9",
    dailyGems: 200,
    energyMax: 40,
    oddsBoost: 0.1,
    emoji: "💎",
    perk: "Mythic odds +10%",
  },
  {
    key: "obsidian",
    name: "Obsidian",
    minCents: 15000,
    color: "#f472b6",
    dailyGems: 500,
    energyMax: 60,
    oddsBoost: 0.18,
    emoji: "🌑",
    perk: "You are the product.",
  },
];

export function vipFor(spentCents: number): VipTier {
  let tier = VIP_TIERS[0];
  for (const t of VIP_TIERS) if (spentCents >= t.minCents) tier = t;
  return tier;
}

/* -------------------------------------------------------------- battle pass */

export type PassTier = {
  tier: number;
  free: { kind: "coins" | "dust" | "gems" | "keys"; amount: number };
  premium: { kind: "coins" | "dust" | "gems" | "keys"; amount: number };
};

export const PASS_TIERS: PassTier[] = Array.from({ length: 30 }, (_, i) => {
  const tier = i + 1;
  const premium = [3, 6, 9, 13, 17, 21, 25, 30].includes(tier)
    ? { kind: "gems" as const, amount: 40 + tier * 8 }
    : { kind: "dust" as const, amount: 60 + tier * 12 };
  const free: PassTier["free"] =
    tier % 5 === 0
      ? { kind: "keys", amount: 1 }
      : tier % 3 === 0
        ? { kind: "gems", amount: 15 + tier }
        : { kind: "coins", amount: 120 + tier * 25 };
  return { tier, free, premium };
});

export const PASS_XP_PER_TIER = 260;
export const PASS_UNLOCK_GEMS = 950;

/* ------------------------------------------------------------------- energy */

export const ENERGY_REGEN_MS = 25_000;
export const XP_PER_LEVEL = 250;

/* -------------------------------------------------------------- fake social */

export const BOT_NAMES = [
  "xX_GemLord_Xx",
  "pixelfelon",
  "notawhale",
  "M0ONRAKER",
  "dustgoblin",
  "kofi_please",
  "Vantablack",
  "SunkCostSam",
  "luckyduck77",
  "cratelord",
  "JustOneMore",
  "ZeroWillpower",
  "rentmoney",
  "mythicmike",
  "pay2win_pam",
  "obsideanite",
  "rip_wallet",
  "SpinalTap42",
];

export const DAILY_COOLDOWN_MS = 20 * 3600_000;

export const DAILY_LABELS = [
  "30 💎",
  "45 💎 + 1 🗝️",
  "70 💎 + dust",
  "110 💎 + 1 🗝️",
  "160 💎 + 120 ✨",
  "240 💎 + 2 🗝️",
  "MEGA 500 💎 + 3 🗝️",
];

export const HOOK_META: Record<string, string> = {
  variable_reward: "Variable-ratio reward",
  near_miss: "Near-miss framing",
  loss_aversion: "Loss aversion (streaks)",
  sunk_cost: "Sunk-cost pressure",
  collection: "Collection completion",
  urgency: "Artificial countdown",
  social_proof: "Social proof / envy feed",
  energy_wall: "Pay-to-skip waiting",
  status: "Status ladder (VIP)",
  gamble: "Gamified chance",
  endless: "Endless goal ladder",
};

export const HOOK_COLORS: Record<string, string> = {
  variable_reward: "#ff4d6d",
  near_miss: "#fb923c",
  loss_aversion: "#38bdf8",
  sunk_cost: "#a78bfa",
  collection: "#34d399",
  urgency: "#fbbf24",
  social_proof: "#22d3ee",
  energy_wall: "#f472b6",
  status: "#c08bff",
  gamble: "#ef4444",
  endless: "#94a3b8",
};
