"use client";

import { useState } from "react";
import {
  DAILY_LABELS,
  HOOK_COLORS,
  HOOK_META,
  ITEMS,
  PASS_TIERS,
  PASS_UNLOCK_GEMS,
  PASS_XP_PER_TIER,
  PACKS,
  RARITY_META,
  VIP_TIERS,
  type Rarity,
} from "@/lib/game/config";
import type { GameState, SetState } from "@/lib/game/types";
import { Bar, Countdown, Pill, SectionTitle, fmt, money } from "./ui";

export type Act = (kind: string, payload?: Record<string, unknown>) => void;

/* ------------------------------------------------------------------ shop */

export function Shop({
  state,
  act,
  busy,
  highlightPack,
}: {
  state: GameState;
  act: Act;
  busy: boolean;
  highlightPack?: string | null;
}) {
  const offer = state.offer;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 px-4 py-3 text-[11px] leading-relaxed text-cyan-100/80">
        <b className="text-cyan-200">SIMULATED STOREFRONT.</b> Every button below is
        wired to a fake wallet. Nothing is charged, no payment API exists in this
        project, and your running total is shown in the Receipt tab so you can watch
        the mechanics work on you in real time.
      </div>

      {offer && (
        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: `linear-gradient(140deg, ${offer.accent}30, rgba(0,0,0,0.5))`,
            border: `1px solid ${offer.accent}88`,
            boxShadow: `0 0 40px ${offer.accent}33`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 anim-scan opacity-20">
            <div className="h-16 w-full blur-2xl" style={{ background: offer.accent }} />
          </div>
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-white">{offer.headline}</div>
                <div className="mt-0.5 text-xs text-white/60">{offer.sub}</div>
              </div>
              <div className="shrink-0 rounded-lg bg-black/50 px-3 py-2 text-center">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                  expires
                </div>
                <Countdown msLeft={offer.msLeft} className="text-lg" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <Bar pct={offer.claimedPct} color={offer.accent} striped />
              </div>
              <span className="text-[10px] font-black tabular-nums text-white/60">
                {offer.claimedPct}% claimed
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex gap-2 text-xs font-black">
                <span className="rounded-lg bg-white/10 px-2 py-1">+{fmt(offer.gems)} 💎</span>
                {offer.keys > 0 && (
                  <span className="rounded-lg bg-white/10 px-2 py-1">+{offer.keys} 🗝️</span>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => act("buy-offer", { offerKey: offer.key })}
                className="press btn-glow ml-auto rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider text-black anim-breathe"
                style={{ background: offer.accent }}
              >
                Buy ${money(offer.priceCents)}
              </button>
            </div>
          </div>
        </div>
      )}

      {!state.me.firstPurchaseBonusUsed && (
        <div className="rounded-2xl border-2 border-dashed border-amber-300/60 bg-amber-300/10 p-4 text-center">
          <div className="shimmer text-2xl font-black">FIRST PURCHASE ×2</div>
          <div className="text-xs text-amber-100/70">
            Your very first pack gives double gems. Once. Forever. Obviously.
          </div>
        </div>
      )}

      <div>
        <SectionTitle hint={`${PACKS.length} packs · best "value" first`}>
          Gem store
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PACKS.map((p) => {
            const hot = highlightPack === p.key;
            const vipExtra =
              p.bonusPct > 0 ? Math.round((p.gems * p.bonusPct) / 100) : 0;
            return (
              <div
                key={p.key}
                className={`relative overflow-hidden rounded-2xl p-4 transition-all ${
                  hot ? "scale-[1.02]" : ""
                }`}
                style={{
                  background: `linear-gradient(165deg, ${p.accent}22, rgba(255,255,255,0.02))`,
                  border: `1px solid ${p.accent}55`,
                  boxShadow: hot ? `0 0 40px ${p.accent}66` : `0 0 18px ${p.accent}22`,
                }}
              >
                {p.badge && (
                  <div className="absolute right-0 top-0 rounded-bl-xl px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-black"
                    style={{ background: p.accent }}>
                    {p.badge}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{p.emoji}</div>
                  <div>
                    <div className="text-sm font-black" style={{ color: p.accent }}>
                      {p.name}
                    </div>
                    <div className="text-2xl font-black tabular-nums text-white">
                      {fmt(p.gems)} <span className="text-base">💎</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {vipExtra > 0 && <Pill color="#34d399">+{fmt(vipExtra)} bonus</Pill>}
                  {p.keys > 0 && <Pill color="#6ef2c0">+{p.keys} 🗝️</Pill>}
                  {!state.me.firstPurchaseBonusUsed && (
                    <Pill color="#fbbf24">×2 first buy</Pill>
                  )}
                </div>
                <div className="mt-3 text-[10px] text-white/35">
                  {money(p.priceCents / p.gems)}¢ per gem
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act("buy-pack", { packKey: p.key })}
                  className="press btn-glow mt-2 w-full rounded-xl py-2.5 text-sm font-black uppercase tracking-wider text-black disabled:opacity-50"
                  style={{ background: p.accent }}
                >
                  ${money(p.priceCents)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle hint="spend more, get more, need more">VIP ladder</SectionTitle>
        <div className="space-y-2">
          {VIP_TIERS.map((t) => {
            const reached = state.me.spentCents >= t.minCents;
            const isCurrent = state.me.vip.key === t.key;
            return (
              <div
                key={t.key}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  isCurrent ? "border-white/30 bg-white/10" : "border-white/8 bg-white/3"
                } ${reached ? "" : "opacity-60"}`}
              >
                <div className="text-2xl">{t.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black" style={{ color: t.color }}>
                    {t.name}
                    {isCurrent && <span className="ml-2 text-[10px] text-white/50">current</span>}
                  </div>
                  <div className="text-[11px] text-white/45">{t.perk}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-white/35">requires</div>
                  <div className="text-xs font-black tabular-nums">
                    ${money(t.minCents)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {state.me.nextVip && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 text-[11px] font-bold text-white/60">
              ${(money(state.me.nextVipGap))} more to reach{" "}
              <b style={{ color: state.me.nextVip.color }}>{state.me.nextVip.name}</b>
            </div>
            <Bar
              pct={(state.me.spentCents / state.me.nextVip.minCents) * 100}
              color={state.me.nextVip.color}
              striped
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ collection */

function SetCard({ set, act, busy }: { set: SetState; act: Act; busy: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        set.complete
          ? "border-emerald-400/50 bg-emerald-400/8"
          : "border-white/8 bg-white/3"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div className="text-3xl">{set.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-black text-white">{set.name}</span>
            {set.claimed && <Pill color="#34d399">claimed</Pill>}
            {set.complete && !set.claimed && <Pill color="#fbbf24">reward ready!</Pill>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="w-28">
              <Bar
                pct={(set.owned / set.total) * 100}
                color={set.complete ? "#34d399" : "#b06bff"}
              />
            </div>
            <span className="text-[10px] font-black tabular-nums text-white/50">
              {set.owned}/{set.total}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right text-[10px] text-white/40">
          <div className="font-black text-emerald-300">+{fmt(set.rewardGems)}💎</div>
          <div>+{fmt(set.rewardDust)}✨</div>
        </div>
        <div className="ml-1 text-white/30">{open ? "▲" : "▼"}</div>
      </button>

      {open && (
        <div className="border-t border-white/8 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {set.items.map((it) => {
              const meta = RARITY_META[it.rarity];
              const owned = it.count > 0;
              return (
                <div
                  key={it.key}
                  className={`rounded-xl border p-2 text-center ${
                    owned ? "" : "opacity-45"
                  }`}
                  style={{
                    borderColor: owned ? `${meta.color}66` : "rgba(255,255,255,0.08)",
                    background: owned ? `${meta.color}12` : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="text-3xl">{owned ? it.emoji : "❔"}</div>
                  <div className="truncate text-[11px] font-black text-white">
                    {owned ? it.name : "???"}
                  </div>
                  <div
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: meta.color }}
                  >
                    {meta.label}
                  </div>
                  {owned ? (
                    <div className="mt-1 text-[9px] font-bold text-white/40">
                      ×{it.count} owned
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act("craft", { itemKey: it.key })}
                      className="press mt-1 w-full rounded-lg border border-violet-400/40 bg-violet-400/10 py-1 text-[9px] font-black uppercase text-violet-200 hover:bg-violet-400/20 disabled:opacity-40"
                    >
                      Forge {fmt(meta.dust * 7)}✨
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {set.complete && !set.claimed && (
            <button
              type="button"
              disabled={busy}
              onClick={() => act("claim-set", { setKey: set.key })}
              className="press mt-3 w-full rounded-xl border border-emerald-300/50 bg-emerald-400/20 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-100 anim-breathe disabled:opacity-40"
            >
              Claim +{fmt(set.rewardGems)} 💎 +{fmt(set.rewardDust)} ✨
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Collection({
  state,
  act,
  busy,
}: {
  state: GameState;
  act: Act;
  busy: boolean;
}) {
  const owned = state.inventory.length;
  const dupes = state.inventory.reduce((a, r) => a + Math.max(0, r.count - 1), 0);
  return (
    <div className="space-y-4">
      <div className="glass grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-4">
        <Metric label="Collected" value={`${state.me.collectionPct}%`} color="#6ef2c0" />
        <Metric label="Unique" value={`${owned}/${ITEMS.length}`} color="#3ea6ff" />
        <Metric label="Duplicates" value={fmt(dupes)} color="#a78bfa" />
        <Metric label="Mythics" value={`${state.me.mythics}`} color="#ff4d6d" />
      </div>
      <div>
        <SectionTitle hint="complete sets for permanent multipliers">
          Collection
        </SectionTitle>
        <div className="space-y-2">
          {state.sets.map((s) => (
            <SetCard key={s.key} set={s} act={act} busy={busy} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pass */

export function Pass({
  state,
  act,
  busy,
}: {
  state: GameState;
  act: Act;
  busy: boolean;
}) {
  const tier = Math.floor(state.me.passXp / PASS_XP_PER_TIER);
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-3xl">🏅</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-white">Obsidian Season Pass</div>
            <div className="text-[11px] text-white/50">
              Tier {tier}/30 · every crate gives +26 pass XP
            </div>
            <div className="mt-2">
              <Bar pct={state.me.passProgress * 100} color="#c08bff" />
            </div>
          </div>
          {!state.me.premiumPass ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => act("unlock-pass")}
              className="press btn-glow rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider text-black anim-breathe disabled:opacity-40"
              style={{ background: "#c08bff" }}
            >
              Unlock · {PASS_UNLOCK_GEMS} 💎
            </button>
          ) : (
            <Pill color="#c08bff">premium active</Pill>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8">
        <div className="grid grid-cols-[44px_1fr_1fr] gap-px bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
          <div className="bg-black/50 px-2 py-2">Tier</div>
          <div className="bg-black/50 px-2 py-2">Free track</div>
          <div className="bg-black/50 px-2 py-2 text-fuchsia-300">Premium track</div>
        </div>
        {PASS_TIERS.map((t) => {
          const reached = tier >= t.tier;
          const claimed = state.me.passClaimed.includes(t.tier);
          return (
            <div
              key={t.tier}
              className={`grid grid-cols-[44px_1fr_1fr] gap-px bg-white/5 ${
                reached ? "" : "opacity-45"
              }`}
            >
              <div className="flex items-center justify-center bg-[#0c0c16] text-xs font-black tabular-nums text-white/60">
                {t.tier}
              </div>
              <div className="flex items-center gap-2 bg-[#0c0c16] px-2 py-2 text-[11px] font-bold text-white/70">
                <span>{iconFor(t.free.kind)}</span> +{fmt(t.free.amount)}
              </div>
              <div className="flex items-center gap-2 bg-[#120b1c] px-2 py-2">
                <span
                  className={`text-[11px] font-bold ${
                    state.me.premiumPass ? "text-fuchsia-200" : "text-white/40"
                  }`}
                >
                  <span>{iconFor(t.premium.kind)}</span> +{fmt(t.premium.amount)}
                </span>
                {state.me.premiumPass && reached && !claimed && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act("claim-pass", { tier: t.tier })}
                    className="press ml-auto rounded-lg bg-fuchsia-500/25 px-2 py-1 text-[9px] font-black uppercase text-fuchsia-100 hover:bg-fuchsia-500/40 disabled:opacity-40"
                  >
                    claim
                  </button>
                )}
                {claimed && <span className="ml-auto text-[9px] text-emerald-400">✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function iconFor(kind: string) {
  return kind === "gems" ? "💎" : kind === "coins" ? "🪙" : kind === "dust" ? "✨" : "🗝️";
}

/* -------------------------------------------------------------- telemetry */

export function Telemetry({ state }: { state: GameState }) {
  const totalWeight = state.hooks.reduce((a, h) => a + h.weight, 0) || 1;
  const sorted = [...state.hooks].sort((a, b) => b.weight - a.weight);
  const top = sorted[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/8 p-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">
          Reality check
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-rose-100/75">
          This app is a working demonstration of free-to-play monetisation design.
          Every mechanic below is deliberately tuned to be habit-forming. The currency
          is fake, the wallet is a database column, and no payment processor is
          contacted — but the psychology is the same one used on real players with
          real money.
        </p>
      </div>

      <div className="glass grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-4">
        <Metric label="Simulated spend" value={`$${money(state.me.spentCents)}`} color="#ff4d6d" />
        <Metric label="Transactions" value={`${state.me.purchaseCount}`} color="#fbbf24" />
        <Metric label="Crates opened" value={fmt(state.me.cratesOpened)} color="#3ea6ff" />
        <Metric
          label="Cost per mythic"
          value={
            state.me.mythics > 0
              ? `$${money(Math.round(state.me.spentCents / state.me.mythics))}`
              : "—"
          }
          color="#b06bff"
        />
      </div>

      {top && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/45">
            Your weakest lever
          </div>
          <div
            className="mt-1 text-xl font-black"
            style={{ color: HOOK_COLORS[top.hook] ?? "#fff" }}
          >
            {HOOK_META[top.hook] ?? top.hook}
          </div>
          <div className="text-[11px] text-white/50">
            Fired {top.weight} times across {top.count} events — that&apos;s the hook
            this experience pulls on you hardest.
          </div>
        </div>
      )}

      <div>
        <SectionTitle hint="live from the hook_events table">
          Manipulation telemetry
        </SectionTitle>
        <div className="space-y-2">
          {sorted.length === 0 && (
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-center text-xs text-white/40">
              No hooks recorded yet. Open a crate.
            </div>
          )}
          {sorted.map((h) => {
            const color = HOOK_COLORS[h.hook] ?? "#94a3b8";
            return (
              <div key={h.hook} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs font-black" style={{ color }}>
                    {HOOK_META[h.hook] ?? h.hook}
                  </div>
                  <div className="text-[10px] font-bold tabular-nums text-white/40">
                    {h.weight} hits
                  </div>
                </div>
                <div className="mt-1.5">
                  <Bar pct={(h.weight / totalWeight) * 100} color={color} />
                </div>
                <div className="mt-1 text-[10px] leading-snug text-white/35">
                  {EXPLAIN[h.hook] ?? ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {state.recentPurchases.length > 0 && (
        <div>
          <SectionTitle>Transaction log</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-white/8">
            {state.recentPurchases.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 border-b border-white/5 bg-black/30 px-3 py-2 text-[11px] last:border-0"
              >
                <span className="font-mono text-white/60">{p.packKey}</span>
                <span className="text-emerald-300">+{fmt(p.gems)} 💎</span>
                <span className="font-black tabular-nums text-rose-300">
                  ${money(p.priceCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const EXPLAIN: Record<string, string> = {
  variable_reward:
    "Unpredictable payouts create the strongest habit loops — the same schedule a slot machine uses.",
  near_miss:
    "Framing a loss as 'almost' keeps you playing. Near misses activate the same brain regions as wins.",
  loss_aversion:
    "Streaks and decaying meters make quitting feel like losing something you own.",
  sunk_cost:
    "Once you've invested 40 pulls into a set, stopping means admitting it was wasted.",
  collection:
    "The Zeigarnik effect: incomplete tasks occupy your mind far more than complete ones.",
  urgency:
    "Countdowns remove the time you'd otherwise use to make a considered decision.",
  social_proof:
    "A feed of other people's lucky pulls makes the odds feel far better than they are.",
  energy_wall:
    "Artificial scarcity on a free resource, with a paid shortcut placed directly next to it.",
  status:
    "A visible spending ladder converts money into identity. Whales get recognised for paying.",
  gamble: "Real money converted to an abstract currency hides the true price of each pull.",
  endless:
    "Season passes and daily ladders ensure there is never a point where you are 'done'.",
};

/* ---------------------------------------------------------------- social */

function ago(ms: number) {
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

export function LiveFeed({ feed }: { feed: GameState["feed"] }) {
  return (
    <div className="glass rounded-2xl p-3">
      <SectionTitle hint="live">Global pulls</SectionTitle>
      <div className="max-h-[320px] space-y-1.5 overflow-y-auto no-scrollbar pr-1">
        {feed.map((f) => {
          const meta = RARITY_META[f.rarity];
          return (
            <div
              key={f.id}
              className={`anim-rise flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
                f.isYou ? "border-white/25 bg-white/8" : "border-white/6 bg-white/3"
              }`}
              style={{ boxShadow: f.rarity === "mythic" ? `0 0 16px ${meta.glow}` : undefined }}
            >
              <span className="text-lg leading-none">{f.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-white/80">
                  <span className={f.isYou ? "text-emerald-300" : "text-white/55"}>
                    {f.isYou ? "YOU" : f.name}
                  </span>{" "}
                  pulled{" "}
                  <span style={{ color: meta.color }}>{f.name}</span>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-white/30">
                  {meta.label} · {ago(f.msAgo)}
                </div>
              </div>
              {f.rarity === "mythic" && <span className="anim-ticker">🔥</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Leaderboard({ state }: { state: GameState }) {
  const rank = state.leaderboard.findIndex((r) => r.isYou) + 1;
  return (
    <div className="glass rounded-2xl p-3">
      <SectionTitle hint={`you are #${rank}`}>Leaderboard</SectionTitle>
      <div className="space-y-1">
        {state.leaderboard.map((r, i) => (
          <div
            key={r.name + i}
            className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${
              r.isYou ? "border border-emerald-400/40 bg-emerald-400/10" : "bg-white/3"
            }`}
          >
            <span className="w-5 text-center text-[11px] font-black tabular-nums text-white/40">
              {i + 1}
            </span>
            <span className="text-lg leading-none">{r.avatar}</span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/80">
              {r.isYou ? "YOU" : r.name}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-white/35">
              {r.vip}
            </span>
            <span className="text-[11px] font-black tabular-nums text-amber-300">
              {fmt(r.score)}
            </span>
          </div>
        ))}
      </div>
      {rank > 3 && (
        <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] font-bold text-amber-200">
          {fmt(state.leaderboard[rank - 2].score - state.me.score)} points behind #
          {rank - 1}. A Celestial ×10 would fix that.
        </div>
      )}
    </div>
  );
}

export function JackpotMeter({ state }: { state: GameState }) {
  const c = state.me.jackpotCharge;
  const urgent = c >= 78;
  return (
    <div
      className={`rounded-2xl p-4 ${
        urgent
          ? "border border-orange-400/50 bg-orange-500/10"
          : "glass"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
          Jackpot meter
        </div>
        <div className="text-lg font-black tabular-nums text-orange-300">{c}/100</div>
      </div>
      <div className="mt-2">
        <Bar pct={c} color={urgent ? "#fb923c" : "#ff4d6d"} height={12} striped />
      </div>
      <div className="mt-2 text-[10px] leading-snug text-white/45">
        {state.me.jackpotReady
          ? "🔥 READY. Your next pull is guaranteed Legendary with a 14% Mythic shot."
          : urgent
            ? "So close. The meter drains 1 point every 2.5 minutes you're away."
            : "Fills with every pull. Drains 1 point every 2.5 minutes you're away."}
      </div>
    </div>
  );
}

export function DailyCard({
  state,
  act,
  busy,
}: {
  state: GameState;
  act: Act;
  busy: boolean;
}) {
  const ready = state.me.dailyReadyIn === 0 || state.me.dailyReadyIn === null;
  const dayIdx = Math.min(6, state.me.streakDays % 7);
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{ready ? "🎁" : "⏳"}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-white">
            {state.me.streakDays > 0 ? `${state.me.streakDays}-day streak` : "No streak"}
          </div>
          <div className="text-[11px] text-white/45">
            🔥 best {state.me.bestStreak} · 🛡️ {state.me.streakShields} shield
          </div>
        </div>
        {ready ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("daily")}
            className="press btn-glow rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black anim-breathe disabled:opacity-40"
            style={{ background: "#34d399" }}
          >
            Claim
          </button>
        ) : (
          <div className="rounded-lg bg-black/40 px-3 py-2 text-center">
            <div className="text-[9px] uppercase tracking-widest text-white/35">next in</div>
            <Countdown msLeft={state.me.dailyReadyIn ?? 0} compact />
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {DAILY_LABELS.map((d, i) => {
          const done = i < dayIdx || (ready && i === dayIdx);
          return (
            <div
              key={i}
              className={`rounded-lg border p-1.5 text-center ${
                i === 6
                  ? "border-rose-400/50 bg-rose-500/10"
                  : done
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/8 bg-white/3"
              }`}
              title={d}
            >
              <div className="text-[9px] font-black text-white/40">D{i + 1}</div>
              <div className="text-[13px]">{i === 6 ? "💎" : done ? "✅" : "❔"}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] leading-snug text-white/40">
        Miss a day and the streak resets to zero — unless you have a shield.
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/35">
        {label}
      </div>
      <div className="text-lg font-black tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export const RARITY_LIST: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];
