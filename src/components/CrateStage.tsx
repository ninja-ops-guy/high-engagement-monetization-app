"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CRATES,
  CRATE_MAP,
  ITEMS,
  RARITY_META,
  crateOdds,
  cratePriceLabel,
  type Rarity,
} from "@/lib/game/config";
import type { GameState, OpenResult } from "@/lib/game/types";
import { sfx } from "@/lib/game/audio";
import { Bar, Confetti, Pill, fmt } from "./ui";

const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

function canAfford(crate: (typeof CRATES)[number], s: GameState, mult = 1) {
  if (crate.energy) return s.me.energy >= crate.energy * mult;
  if (crate.keys) return s.me.keys >= crate.keys * mult;
  if (crate.coins) return s.me.coins >= crate.coins * mult;
  return s.me.gems >= Math.round((crate.gems ?? 0) * mult * (mult >= 10 ? 0.9 : 1));
}

function priceFor(crate: (typeof CRATES)[number], mult = 1) {
  const disc = mult >= 10 ? 0.9 : 1;
  if (crate.energy) return `${crate.energy * mult} ⚡`;
  if (crate.keys) return `${crate.keys * mult} 🗝️`;
  if (crate.coins) return `${fmt(crate.coins * mult)} 🪙`;
  return `${fmt(Math.round((crate.gems ?? 0) * mult * disc))} 💎`;
}

/* ------------------------------------------------------------- crate card */

function CrateCard({
  crate,
  state,
  onOpen,
  onShop,
  selected,
  onSelect,
}: {
  crate: (typeof CRATES)[number];
  state: GameState;
  onOpen: (key: string, count: number) => void;
  onShop: () => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const odds = crateOdds(crate);
  const afford1 = canAfford(crate, state, 1);
  const afford10 = canAfford(crate, state, 10);
  const best = [...odds].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])[0];

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl p-3 transition-all duration-300 ${
        selected ? "border-2" : "glass-2 border border-white/8 hover:border-white/20"
      } ${afford1 ? "" : "opacity-55"}`}
      style={
        selected
          ? {
              borderColor: crate.accent,
              background: `linear-gradient(165deg, ${crate.accent}26, rgba(255,255,255,0.02))`,
              boxShadow: `0 0 34px ${crate.accent}33`,
            }
          : undefined
      }
    >
      {crate.hot && (
        <div className="absolute right-2 top-2 z-10 rotate-3">
          <Pill color="#ff4d6d">🔥 hot</Pill>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 opacity-30 anim-scan">
        <div
          className="h-8 w-full blur-xl"
          style={{ background: crate.accent }}
        />
      </div>

      <div className="relative flex items-center gap-3">
        <div
          className={`text-4xl ${selected ? "anim-float" : ""}`}
          style={{ filter: `drop-shadow(0 0 12px ${crate.accent})` }}
        >
          {crate.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black" style={{ color: crate.accent }}>
            {crate.name}
          </div>
          <div className="truncate text-[11px] text-white/45">{crate.tagline}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {odds
              .filter((o) => RARITY_ORDER[o.rarity] >= RARITY_ORDER.epic)
              .map((o) => (
                <span
                  key={o.rarity}
                  className="rounded px-1.5 py-0.5 text-[9px] font-black tabular-nums"
                  style={{
                    color: RARITY_META[o.rarity].color,
                    background: `${RARITY_META[o.rarity].color}1f`,
                  }}
                >
                  {RARITY_META[o.rarity].label} {o.pct.toFixed(o.pct < 1 ? 2 : 1)}%
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {odds.map((o) => (
          <div key={o.rarity} className="flex items-center gap-2">
            <span
              className="w-3 text-[10px]"
              style={{ color: RARITY_META[o.rarity].color }}
            >
              ●
            </span>
            <div className="flex-1">
              <Bar
                pct={o.pct}
                height={5}
                color={RARITY_META[o.rarity].color}
                glow={o.pct > 5}
              />
            </div>
            <span className="w-9 text-right text-[9px] font-bold tabular-nums text-white/35">
              {o.pct.toFixed(o.pct < 1 ? 2 : 0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-white/40">
        <span>⚡ +{crate.jackpot} jackpot charge</span>
        <span>floor: {crate.floor ? RARITY_META[crate.floor].label : best.rarity}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!afford1}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(crate.key, 1);
          }}
          className={`press btn-glow flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-wide ${
            afford1 ? "text-black" : "cursor-not-allowed text-white/40"
          }`}
          style={{
            background: afford1 ? crate.accent : "rgba(255,255,255,0.07)",
            boxShadow: afford1 ? `0 6px 22px ${crate.accent}55` : undefined,
          }}
        >
          Open · {priceFor(crate, 1)}
        </button>
        {!crate.energy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (afford10) onOpen(crate.key, 10);
              else onShop();
            }}
            className={`press rounded-xl px-2.5 py-2 text-[10px] font-black uppercase leading-tight ${
              afford10 ? "text-black" : "text-amber-300"
            }`}
            style={{
              background: afford10 ? "#ffd166" : "rgba(255,209,102,0.12)",
              border: "1px solid rgba(255,209,102,0.5)",
            }}
          >
            ×10
            <br />
            -10%
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- reveal overlay */

export function RevealOverlay({
  result,
  crateKey,
  state,
  onDone,
  onAgain,
  onShop,
}: {
  result: OpenResult;
  crateKey: string;
  state: GameState;
  onDone: () => void;
  onAgain: () => void;
  onShop: () => void;
}) {
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const [spinIdx, setSpinIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const crate = CRATE_MAP[crateKey];

  const spinItems = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ITEMS[(index * 17 + 7) % ITEMS.length]),
    [],
  );

  useEffect(() => {
    sfx.open();
    let delay = 55;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      setSpinIdx((i) => i + 1);
      sfx.tick();
      delay = delay * 1.16 + 8;
      if (delay > 430) {
        setPhase("reveal");
        return;
      }
      timerRef.current = window.setTimeout(step, delay);
    };
    timerRef.current = window.setTimeout(step, delay);
    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    if (result.jackpot) sfx.fanfare();
    result.pulls.forEach((p, i) => {
      window.setTimeout(() => sfx.reveal(p.rarity), i * 230);
    });
  }, [phase, result]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onDone]);

  const bestPull = [...result.pulls].sort(
    (a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity],
  )[0];
  const dupeDust = result.pulls.reduce((a, p) => a + p.dust, 0);
  const coinGain = result.pulls.reduce((a, p) => a + p.coins, 0);
  const newCount = result.pulls.filter((p) => !p.duplicate).length;
  const nearMiss = !result.jackpot && result.jackpotCharge >= 78;
  const againAffordable = crate ? canAfford(crate, state, 1) : false;

  const spinning = spinItems[spinIdx % spinItems.length];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-3">
      <div className="absolute inset-0 bg-black/88 backdrop-blur-md" />
      {result.jackpot && (
        <div className="pointer-events-none absolute inset-0 z-20 anim-flash bg-white" />
      )}
      {result.jackpot && <Confetti count={110} />}

      <div className="relative z-30 w-full max-w-2xl">
        {phase === "spin" ? (
          <div className="flex flex-col items-center gap-6 py-16">
            <div
              className="anim-wobble text-8xl"
              style={{ filter: `drop-shadow(0 0 30px ${crate?.accent ?? "#fff"})` }}
            >
              {crate?.emoji ?? "📦"}
            </div>
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 text-5xl"
              style={{
                borderColor: RARITY_META[spinning.rarity].color,
                background: `${RARITY_META[spinning.rarity].color}18`,
                boxShadow: `0 0 40px ${RARITY_META[spinning.rarity].color}66`,
              }}
            >
              {spinning.emoji}
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">
              decrypting crate…
            </div>
          </div>
        ) : (
          <div className="anim-rise">
            {result.jackpot && (
              <div className="mb-3 text-center">
                <div className="shimmer text-3xl font-black tracking-tight sm:text-5xl">
                  ★ JACKPOT ★
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.3em] text-rose-300">
                  charge full · mythic odds unleashed
                </div>
              </div>
            )}
            {result.levelUp && (
              <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-center text-sm font-black text-amber-200">
                ⬆ LEVEL {result.newLevel} — new rewards unlocked
              </div>
            )}

            <div
              className={`grid gap-3 ${
                result.pulls.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {result.pulls.map((p, i) => {
                const meta = RARITY_META[p.rarity];
                return (
                  <div
                    key={`${p.itemKey}-${i}`}
                    className="anim-pop relative overflow-hidden rounded-2xl border-2 p-3 text-center"
                    style={{
                      animationDelay: `${i * 0.23}s`,
                      borderColor: meta.color,
                      background: `radial-gradient(120% 90% at 50% 0%, ${meta.color}30, rgba(0,0,0,0.6))`,
                      boxShadow: `0 0 30px ${meta.glow}`,
                    }}
                  >
                    {p.rarity === "mythic" && (
                      <div className="pointer-events-none absolute inset-0 anim-scan opacity-25">
                        <div className="h-10 w-full blur-lg" style={{ background: meta.color }} />
                      </div>
                    )}
                    <div
                      className="text-[9px] font-black uppercase tracking-[0.25em]"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </div>
                    <div className="my-1 text-5xl">{p.emoji}</div>
                    <div className="truncate text-sm font-black text-white">{p.name}</div>
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {p.duplicate ? (
                        <Pill color="#94a3b8">dupe +{p.dust}✨</Pill>
                      ) : (
                        <Pill color="#34d399">new!</Pill>
                      )}
                      <Pill color="#fbbf24">+{p.coins}🪙</Pill>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Best pull" value={RARITY_META[bestPull.rarity].label} color={RARITY_META[bestPull.rarity].color} />
              <Stat label="New items" value={`${newCount}`} color="#34d399" />
              <Stat label="Dust" value={`+${fmt(dupeDust)}`} color="#a78bfa" />
              <Stat label="Coins" value={`+${fmt(coinGain)}`} color="#fbbf24" />
            </div>

            {nearMiss && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-400/50 bg-orange-500/10 p-3">
                <div className="text-2xl anim-ticker">⚡</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-orange-200">
                    {result.jackpotCharge}/100 — SO CLOSE
                  </div>
                  <div className="text-[11px] text-orange-200/70">
                    The jackpot meter resets if you stop now. One more pull.
                  </div>
                  <div className="mt-1.5">
                    <Bar pct={result.jackpotCharge} color="#fb923c" striped />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onAgain}
                className={`press btn-glow flex-1 rounded-xl py-3 text-sm font-black uppercase tracking-wide ${
                  againAffordable ? "text-black" : "text-amber-300"
                }`}
                style={{
                  background: againAffordable ? crate?.accent ?? "#fff" : "rgba(255,209,102,0.12)",
                  border: againAffordable ? undefined : "1px solid rgba(255,209,102,0.5)",
                }}
              >
                {againAffordable ? `Open again · ${crate ? priceFor(crate, 1) : ""}` : "Out of currency → Shop"}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="press rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-wide text-white/70 hover:bg-white/10"
              >
                Continue
              </button>
            </div>
            {!againAffordable && (
              <button
                type="button"
                onClick={onShop}
                className="mt-2 w-full text-center text-[11px] font-bold uppercase tracking-widest text-amber-300/80 hover:text-amber-200"
              >
                Refill instantly in the shop →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-2 rounded-xl px-2 py-2 text-center">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/35">
        {label}
      </div>
      <div className="text-sm font-black" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stage */

export default function CrateStage({
  state,
  onOpen,
  onShop,
  busy,
  error,
}: {
  state: GameState;
  onOpen: (key: string, count: number) => void;
  onShop: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState("obsidian");
  const crate = CRATE_MAP[selected];

  return (
    <div className="space-y-4">
      {error && (
        <div className="anim-shake rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
          {error}{" "}
          <button
            type="button"
            onClick={onShop}
            className="ml-1 underline decoration-dotted"
          >
            Refill in the shop →
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CRATES.map((c) => (
          <CrateCard
            key={c.key}
            crate={c}
            state={state}
            onOpen={onOpen}
            onShop={onShop}
            selected={selected === c.key}
            onSelect={() => setSelected(c.key)}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-4">
          <div className="text-4xl anim-float" style={{ filter: `drop-shadow(0 0 14px ${crate.accent})` }}>
            {crate.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-black" style={{ color: crate.accent }}>
              {crate.name}
            </div>
            <p className="text-xs text-white/50">
              {crate.tagline} — opening this crate adds <b>+{crate.jackpot}</b> to the
              jackpot meter. At 100 the next pull is a guaranteed Legendary floor with a{" "}
              <b className="text-rose-300">14% Mythic</b> shot.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !canAfford(crate, state, 1)}
                onClick={() => onOpen(selected, 1)}
                className="press btn-glow rounded-xl px-6 py-3 text-sm font-black uppercase tracking-wider text-black disabled:opacity-40"
                style={{ background: crate.accent, boxShadow: `0 8px 26px ${crate.accent}55` }}
              >
                {busy ? "Opening…" : `Open 1 · ${cratePriceLabel(crate)}`}
              </button>
              {!crate.energy && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onOpen(selected, 10)}
                  className="press rounded-xl border border-amber-300/50 bg-amber-300/15 px-5 py-3 text-sm font-black uppercase tracking-wider text-amber-200 disabled:opacity-40"
                >
                  Open ×10 (-10%)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
