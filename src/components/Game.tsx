"use client";
import { localFetch } from "@/lib/local-fetch";


import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrateStage, { RevealOverlay } from "./CrateStage";
import {
  Collection,
  DailyCard,
  JackpotMeter,
  Leaderboard,
  LiveFeed,
  Pass,
  Shop,
  Telemetry,
} from "./Panels";
import { Chip, Countdown, Modal, Pill, fmt, money } from "./ui";
import { isMuted, setMuted, sfx } from "@/lib/game/audio";
import { RARITY_META, ITEM_MAP } from "@/lib/game/config";
import type { GameState, OpenResult } from "@/lib/game/types";

type Tab = "crates" | "shop" | "collection" | "pass" | "receipt";

const TABS: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "crates", label: "Crates", icon: "📦" },
  { key: "shop", label: "Store", icon: "💳" },
  { key: "collection", label: "Collection", icon: "🗂️" },
  { key: "pass", label: "Pass", icon: "🏅" },
  { key: "receipt", label: "Receipt", icon: "🧾" },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await localFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

type ApiResponse = {
  ok: boolean;
  error?: string;
  toast?: string;
  state?: GameState;
  result?: OpenResult;
};

function Loading() {
  return (
    <div className="cf-bg flex min-h-screen flex-col items-center justify-center gap-5">
      <div className="anim-wobble text-7xl" style={{ filter: "drop-shadow(0 0 30px #ff4d6d)" }}>
        📦
      </div>
      <div className="shimmer text-2xl font-black tracking-tight">CRATEFALL</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/35">
        negotiating with the goblin…
      </div>
    </div>
  );
}

export default function Game() {
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("crates");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ result: OpenResult; crateKey: string } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string; tone: string }>>([]);
  const [welcome, setWelcome] = useState(false);
  const [info, setInfo] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [highlightPack, setHighlightPack] = useState<string | null>(null);
  const toastId = useRef(0);

  const pushToast = useCallback((text: string, tone = "#6ef2c0") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const apply = useCallback(
    (data: ApiResponse) => {
      if (data.state) setState(data.state);
      if (!data.ok && data.error) {
        setError(data.error);
        sfx.error();
        pushToast(data.error, "#ff4d6d");
      }
      if (data.ok && data.toast) {
        pushToast(data.toast, "#6ef2c0");
        sfx.coin();
      }
      return data.ok;
    },
    [pushToast],
  );

  /* -------------------------------------------------------------- loading */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await localFetch("/api/state", { cache: "no-store" });
        const data = (await res.json()) as ApiResponse;
        if (alive && data.state) setState(data.state);
      } catch {
        if (alive) pushToast("Connection hiccup — retrying…", "#ff4d6d");
      }
    };
    void load();
    const id = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [pushToast]);

  /* --------------------------------------------- ambient social pressure */
  useEffect(() => {
    const buyers = [
      "pay2win_pam",
      "SunkCostSam",
      "JustOneMore",
      "mythicmike",
      "rentmoney",
      "ZeroWillpower",
      "cratelord",
      "luckyduck77",
    ];
    const packs = ["Crateful", "Obsidian Trunk", "The Entire Vault", "Mythic Surge"];
    const id = window.setInterval(
      () => {
        if (document.hidden) return;
        const who = buyers[Math.floor(Math.random() * buyers.length)];
        const what = packs[Math.floor(Math.random() * packs.length)];
        pushToast(`💎 ${who} just bought ${what}`, "#22d3ee");
      },
      22_000 + Math.random() * 14_000,
    );
    return () => window.clearInterval(id);
  }, [pushToast]);

  /* --------------------------------------------------- interstitial offer */
  useEffect(() => {
    if (!state) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("cratefall_seen_welcome") === "1") return;
    const id = window.setTimeout(() => {
      setWelcome(true);
      window.localStorage.setItem("cratefall_seen_welcome", "1");
    }, 5200);
    return () => window.clearTimeout(id);
  }, [state]);

  /* ------------------------------------------------------------- actions */
  const open = useCallback(
    async (crateKey: string, count: number) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        const data = await post<ApiResponse>("/api/open", { crateKey, count });
        if (data.state) setState(data.state);
        if (!data.ok) {
          setError(data.error ?? "Could not open.");
          sfx.error();
          if (/Need/.test(data.error ?? "")) setTab("shop");
        } else if (data.result) {
          setReveal({ result: data.result, crateKey });
        }
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const act = useCallback(
    async (kind: string, payload: Record<string, unknown> = {}) => {
      if (busy) return;
      setBusy(true);
      try {
        const data = await post<ApiResponse>("/api/action", { kind, payload });
        apply(data);
      } finally {
        setBusy(false);
      }
    },
    [apply, busy],
  );

  const buyPack = useCallback(
    async (packKey: string) => {
      if (busy) return;
      setBusy(true);
      setHighlightPack(packKey);
      try {
        const data = await post<ApiResponse>("/api/action", {
          kind: "buy-pack",
          payload: { packKey },
        });
        if (data.state) setState(data.state);
        if (data.ok) {
          sfx.fanfare();
          setWelcome(false);
          pushToast(data.toast ?? "Purchased!", "#ffd166");
        } else {
          sfx.error();
          pushToast(data.error ?? "Failed", "#ff4d6d");
        }
      } finally {
        setBusy(false);
        window.setTimeout(() => setHighlightPack(null), 2600);
      }
    },
    [busy, pushToast],
  );

  const ticker = useMemo(() => {
    if (!state) return [];
    const lines = state.feed
      .filter((f) => !f.isYou)
      .slice(0, 10)
      .map(
        (f) =>
          `🔥 ${f.name} pulled ${RARITY_META[f.rarity].label} ${ITEM_MAP[f.itemKey]?.name ?? "an item"} ${f.emoji}`,
      );
    return lines.length ? lines : ["Welcome to CRATEFALL"];
  }, [state]);

  if (!state) return <Loading />;

  const me = state.me;
  const energySecs = Math.ceil(me.energyMsToNext / 1000);

  return (
    <div className="cf-bg min-h-screen text-white">
      {/* ------------------------------------------------------------ header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2.5">
          <div className="mr-1 flex items-center gap-2">
            <span className="text-2xl" style={{ filter: "drop-shadow(0 0 10px #ff4d6d)" }}>
              📦
            </span>
            <span className="shimmer text-lg font-black tracking-tight">CRATEFALL</span>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <Chip icon="💎" value={fmt(me.gems)} color="#7dd3fc" onClick={() => setTab("shop")} pulse={me.gems < 60} title="Gems" />
            <Chip icon="🪙" value={fmt(me.coins)} color="#fbbf24" title="Coins" />
            <Chip icon="✨" value={fmt(me.dust)} color="#c4b5fd" title="Dust" />
            <Chip icon="🗝️" value={me.keys} color="#6ef2c0" title="Vault keys" />
            <Chip
              icon="⚡"
              value={me.energy >= me.energyMax ? `${me.energy}/${me.energyMax}` : `${me.energy} · ${energySecs}s`}
              color="#f87171"
              onClick={() => setTab("shop")}
              pulse={me.energy <= 2}
              title="Energy"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex"
              style={{ borderColor: `${me.vip.color}66`, background: `${me.vip.color}18` }}
            >
              <span className="text-sm">{me.vip.emoji}</span>
              <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: me.vip.color }}>
                {me.vip.name}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-2.5 py-1">
              <span className="text-sm">🔥</span>
              <span className="text-[11px] font-black tabular-nums text-orange-300">
                {me.streakDays}d
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                lvl
              </span>
              <span className="text-[11px] font-black tabular-nums text-white">{me.level}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !isMuted();
                setMuted(next);
                setMutedState(next);
              }}
              className="press rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-sm"
              title="Toggle sound"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              type="button"
              onClick={() => setInfo(true)}
              className="press rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-black"
              title="What is this?"
            >
              ?
            </button>
          </div>
        </div>

        {/* xp bar */}
        <div className="h-[3px] w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${(me.xp / me.xpNeeded) * 100}%` }}
          />
        </div>
      </header>

      {/* ------------------------------------------------------------- ticker */}
      <div className="overflow-hidden border-b border-white/8 bg-black/50 py-1.5">
        <div className="anim-marquee flex w-max gap-8 whitespace-nowrap">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="text-[11px] font-bold text-white/45">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------- offer bar */}
      {state.offer && (
        <div
          className="relative z-30 border-b px-3 py-2"
          style={{
            background: `linear-gradient(90deg, ${state.offer.accent}33, rgba(0,0,0,0.4))`,
            borderColor: `${state.offer.accent}55`,
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
            <span className="text-lg anim-ticker">{state.offer.emoji}</span>
            <span className="text-xs font-black text-white">{state.offer.headline}</span>
            <span className="hidden text-[11px] text-white/50 sm:inline">
              {state.offer.claimedPct}% claimed
            </span>
            <span className="ml-auto flex items-center gap-3">
              <Countdown msLeft={state.offer.msLeft} className="text-sm" />
              <button
                type="button"
                disabled={busy}
                onClick={() => void act("buy-offer", { offerKey: state.offer!.key })}
                className="press btn-glow rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider text-black anim-breathe disabled:opacity-40"
                style={{ background: state.offer.accent }}
              >
                ${money(state.offer.priceCents)}
              </button>
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- main */}
      <main className="mx-auto grid max-w-7xl gap-4 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <nav className="mb-4 flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  sfx.tick();
                }}
                className={`press flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                  tab === t.key
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
                {t.key === "receipt" && me.purchaseCount > 0 && (
                  <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white">
                    {me.purchaseCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {tab === "crates" && (
            <CrateStage
              state={state}
              onOpen={(k, c) => void open(k, c)}
              onShop={() => setTab("shop")}
              busy={busy}
              error={error}
            />
          )}
          {tab === "shop" && (
            <Shop state={state} act={(k, p) => void act(k, p)} busy={busy} highlightPack={highlightPack} />
          )}
          {tab === "collection" && (
            <Collection state={state} act={(k, p) => void act(k, p)} busy={busy} />
          )}
          {tab === "pass" && <Pass state={state} act={(k, p) => void act(k, p)} busy={busy} />}
          {tab === "receipt" && <Telemetry state={state} />}
        </div>

        <aside className="hidden space-y-3 lg:block">
          <JackpotMeter state={state} />
          <DailyCard state={state} act={(k, p) => void act(k, p)} busy={busy} />
          <LiveFeed feed={state.feed} />
          <Leaderboard state={state} />
          <div className="glass rounded-2xl p-3">
            <SectionLabel>Your numbers</SectionLabel>
            <div className="grid grid-cols-2 gap-2 text-center">
              <MiniStat label="Crates" value={fmt(me.cratesOpened)} />
              <MiniStat label="Mythics" value={`${me.mythics}`} />
              <MiniStat label="Legendaries" value={`${me.legendaries}`} />
              <MiniStat label="Collection" value={`${me.collectionPct}%`} />
            </div>
          </div>
        </aside>
      </main>

      {/* mobile quick strip */}
      <div className="mx-auto max-w-7xl space-y-3 px-3 pb-24 lg:hidden">
        <JackpotMeter state={state} />
        <DailyCard state={state} act={(k, p) => void act(k, p)} busy={busy} />
        <LiveFeed feed={state.feed} />
        <Leaderboard state={state} />
      </div>

      {/* sticky buy button */}
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        <button
          type="button"
          onClick={() => {
            setTab("shop");
            sfx.coin();
          }}
          className="press btn-glow flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-wider text-black shadow-2xl"
          style={{ background: "linear-gradient(90deg,#ffd166,#ff4d6d)" }}
        >
          💎 Get gems
          {!me.firstPurchaseBonusUsed && <Pill color="#000000">×2 first buy</Pill>}
        </button>
      </div>

      {/* -------------------------------------------------------------- toasts */}
      <div className="pointer-events-none fixed left-1/2 top-20 z-[70] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="anim-toast rounded-xl border px-4 py-2.5 text-center text-xs font-black shadow-xl backdrop-blur-md"
            style={{ borderColor: `${t.tone}66`, background: `${t.tone}22`, color: t.tone }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------------- reveal */}
      {reveal && (
        <RevealOverlay
          result={reveal.result}
          crateKey={reveal.crateKey}
          state={state}
          onDone={() => setReveal(null)}
          onAgain={() => {
            const key = reveal.crateKey;
            setReveal(null);
            void open(key, 1);
          }}
          onShop={() => {
            setReveal(null);
            setTab("shop");
          }}
        />
      )}

      {/* ------------------------------------------------------------- welcome */}
      <Modal open={welcome} onClose={() => setWelcome(false)} dismissable>
        <div className="text-center">
          <div className="text-6xl">🎁</div>
          <div className="shimmer mt-2 text-3xl font-black">STARTER VAULT</div>
          <p className="mt-1 text-xs text-white/60">
            A one-time welcome gift, just for you. Today only. Definitely.
          </p>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-300/60 bg-amber-300/10 p-4">
            <div className="text-4xl font-black tabular-nums text-amber-200">
              {130 * 2} 💎
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-100/60">
              double the normal amount
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void buyPack("starter")}
            className="press btn-glow mt-4 w-full rounded-xl py-3.5 text-base font-black uppercase tracking-wider text-black anim-breathe disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#ffd166,#ff4d6d)" }}
          >
            Buy $0.99
          </button>
          <button
            type="button"
            onClick={() => setWelcome(false)}
            className="mt-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white/50"
          >
            no thanks, i hate value
          </button>
        </div>
      </Modal>

      {/* ---------------------------------------------------------------- info */}
      <Modal open={info} onClose={() => setInfo(false)} wide>
        <div className="space-y-3">
          <div className="text-2xl font-black">
            📦 CRATEFALL <span className="text-white/40">/ a monetisation demo</span>
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            This is a fully playable loot-crate game built to be as habit-forming as
            possible: variable-ratio rewards, near-miss framing, a decaying jackpot
            meter, streak loss-aversion, a decaying-energy paywall, a collection
            completion grind, a 30-tier season pass, a VIP spending ladder, an envy
            feed and rotating countdown offers.
          </p>
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/8 p-3 text-sm text-cyan-100/85">
            <b>Nothing is real.</b> There is no payment processor in this project. The
            storefront writes to a <code>spent_cents</code> column in Postgres. Your
            total is shown in the <b>Receipt</b> tab along with a breakdown of which
            psychological hook got you, and how many times.
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["💎 Gems", "Premium currency that hides the real price of a pull."],
              ["⚡ Energy", "Free but scarce — with a paid shortcut right next to it."],
              ["🎯 Jackpot meter", "Fills with pulls, drains while you're away."],
              ["🔥 Streaks", "Break one day and you lose everything you built."],
              ["🗂️ Collection", "Incomplete sets nag at you until you finish them."],
              ["🏅 Season pass", "A 30-tier ladder that resets, forever."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="text-xs font-black">{k}</div>
                <div className="text-[11px] text-white/50">{v}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setInfo(false)}
            className="press w-full rounded-xl bg-white py-3 text-sm font-black uppercase tracking-wider text-black"
          >
            Let&apos;s open some crates
          </button>
        </div>
      </Modal>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 px-2 py-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/35">
        {label}
      </div>
      <div className="text-sm font-black tabular-nums">{value}</div>
    </div>
  );
}
