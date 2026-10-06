"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export function money(cents: number) {
  const d = cents / 100;
  return d.toFixed(2);
}

export function useTicker(intervalMs = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

export function Bar({
  pct,
  color = "#ff4d6d",
  height = 8,
  glow = true,
  striped = false,
}: {
  pct: number;
  color?: string;
  height?: number;
  glow?: boolean;
  striped?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-white/8"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          boxShadow: glow ? `0 0 12px ${color}aa` : undefined,
          position: "relative",
        }}
      >
        {striped && (
          <div className="absolute inset-0 stripes opacity-40" aria-hidden />
        )}
      </div>
    </div>
  );
}

export function Chip({
  icon,
  value,
  color = "#fff",
  title,
  onClick,
  pulse,
}: {
  icon: string;
  value: string | number;
  color?: string;
  title?: string;
  onClick?: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-sm font-bold tabular-nums ${
        onClick ? "press cursor-pointer hover:border-white/25" : "cursor-default"
      } ${pulse ? "anim-breathe" : ""}`}
      style={{ color }}
    >
      <span className="text-[13px] leading-none">{icon}</span>
      {value}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  children,
  wide = false,
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  dismissable?: boolean;
}) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose, dismissable]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        className={`anim-pop relative z-10 max-h-[92vh] w-full overflow-y-auto no-scrollbar rounded-3xl border border-white/12 p-5 shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
        style={{
          background:
            "linear-gradient(165deg, rgba(28,20,48,0.98), rgba(10,10,20,0.99))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Confetti({ count = 70 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 380;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist + 260}px`,
          rot: `${Math.random() * 1080 - 540}deg`,
          color: ["#ff4d6d", "#ffb02e", "#b06bff", "#3ea6ff", "#6ef2c0", "#ffffff"][
            Math.floor(Math.random() * 6)
          ],
          delay: `${Math.random() * 0.25}s`,
          scale: 0.6 + Math.random() * 0.9,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={
            {
              left: "50%",
              top: "42%",
              background: b.color,
              animationDelay: b.delay,
              transform: `scale(${b.scale})`,
              "--dx": b.dx,
              "--dy": b.dy,
              "--rot": b.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function Countdown({
  msLeft,
  className = "",
  compact = false,
}: {
  msLeft: number;
  className?: string;
  compact?: boolean;
}) {
  const [ms, setMs] = useState(msLeft);
  const startRef = useRef({ left: msLeft, at: Date.now() });
  useEffect(() => {
    startRef.current = { left: msLeft, at: Date.now() };
    setMs(msLeft);
  }, [msLeft]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMs(Math.max(0, startRef.current.left - (Date.now() - startRef.current.at)));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const urgent = total < 120;
  const label = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span
      className={`font-mono font-black tabular-nums ${className} ${
        urgent ? "text-rose-400 anim-ticker" : ""
      }`}
    >
      {compact ? label : `⏱ ${label}`}
    </span>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
        {children}
      </h2>
      {hint ? <div className="text-[11px] text-white/40">{hint}</div> : null}
    </div>
  );
}

export function Pill({
  children,
  color = "#ffffff",
  bg,
}: {
  children: ReactNode;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={{
        color,
        background: bg ?? `${color}22`,
        border: `1px solid ${color}55`,
      }}
    >
      {children}
    </span>
  );
}
