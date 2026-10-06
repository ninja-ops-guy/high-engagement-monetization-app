import type { Rarity } from "./config";
import type { VipTier, PassTier } from "./config";

export type SetState = {
  key: string;
  name: string;
  emoji: string;
  total: number;
  owned: number;
  complete: boolean;
  claimed: boolean;
  rewardGems: number;
  rewardDust: number;
  permanentBonus: number;
  items: Array<{
    key: string;
    name: string;
    emoji: string;
    rarity: Rarity;
    blurb: string;
    count: number;
  }>;
};

export type FeedEntry = {
  id: string;
  name: string;
  avatar: string | null;
  itemKey: string;
  emoji: string;
  rarity: Rarity;
  crateKey: string;
  isYou: boolean;
  msAgo: number;
};

export type GameState = {
  me: {
    id: number;
    name: string;
    avatar: string;
    gems: number;
    coins: number;
    dust: number;
    keys: number;
    energy: number;
    energyMax: number;
    energyMsToNext: number;
    streakDays: number;
    bestStreak: number;
    streakShields: number;
    dailyReadyIn: number | null;
    level: number;
    xp: number;
    xpNeeded: number;
    passXp: number;
    passTier: number;
    passProgress: number;
    premiumPass: boolean;
    passClaimed: number[];
    jackpotCharge: number;
    jackpotReady: boolean;
    spentCents: number;
    purchaseCount: number;
    firstPurchaseBonusUsed: boolean;
    cratesOpened: number;
    mythics: number;
    legendaries: number;
    score: number;
    vip: VipTier;
    nextVip: VipTier | null;
    nextVipGap: number;
    collectionPct: number;
    createdAt: string;
  };
  inventory: Array<{ key: string; count: number }>;
  sets: SetState[];
  offer: {
    key: string;
    headline: string;
    sub: string;
    priceCents: number;
    gems: number;
    keys: number;
    claimedPct: number;
    emoji: string;
    accent: string;
    msLeft: number;
  } | null;
  feed: FeedEntry[];
  leaderboard: Array<{
    name: string;
    avatar: string;
    score: number;
    isYou: boolean;
    vip: string;
  }>;
  hooks: Array<{ hook: string; count: number; weight: number }>;
  recentPurchases: Array<{
    packKey: string;
    priceCents: number;
    gems: number;
    at: string;
  }>;
};

export type OpenPull = {
  itemKey: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  set: string;
  duplicate: boolean;
  dust: number;
  coins: number;
};

export type OpenResult = {
  pulls: OpenPull[];
  jackpot: boolean;
  energy: number;
  gems: number;
  coins: number;
  dust: number;
  keys: number;
  xpGain: number;
  levelUp: boolean;
  newLevel: number;
  jackpotCharge: number;
};

export type PassTierView = PassTier;
