"use client";

import { useEffect, useState } from "react";

interface Stats {
  status: string;
  total: number;
  days: { date: string; count: number }[];
}

const W = 600;
const H = 170;
const PAD_L = 34;
const PAD_R = 6;
const PAD_T = 10;
const BASE = H - 24;

export default function VisitsChart() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => (d.status === "ok" ? setStats(d) : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <p className="font-mono text-sm text-sub">stats unavailable from this origin</p>;
  }
  if (!stats) {
    return <p className="font-mono text-sm text-faint">loading series...</p>;
  }

  const days = stats.days;
  const max = Math.max(1, ...days.map((d) => d.count));
  const plotW = W - PAD_L - PAD_R;
  const step = plotW / days.length;
  const barW = Math.max(2, step - 2);
  const y = (v: number) => BASE - (v / max) * (BASE - PAD_T);

  const fmt = (iso: string) => iso.slice(5);
  const hovered = hover != null ? days[hover] : null;

  return (
    <div className="relative">
      <p className="mb-4 font-mono text-sm text-sub">
        total <span className="text-cyan">{stats.total.toLocaleString("en-US")}</span>
        <span className="text-faint"> · last 30 days below</span>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Daily visits, last 30 days. Peak ${max} on a single day.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="plot-clip">
            <rect x={PAD_L} y={0} width={plotW} height={BASE} />
          </clipPath>
        </defs>

        {[0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(max * f)}
              y2={y(max * f)}
              stroke="var(--color-line)"
              strokeWidth="1"
            />
            <text x={PAD_L - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-faint)">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        <line x1={PAD_L} x2={W - PAD_R} y1={BASE} y2={BASE} stroke="var(--color-line)" strokeWidth="1" />

        <g clipPath="url(#plot-clip)">
          {days.map((d, i) => {
            const bh = BASE - y(d.count);
            if (bh <= 0) return null;
            return (
              <rect
                key={d.date}
                x={PAD_L + i * step + (step - barW) / 2}
                y={y(d.count)}
                width={barW}
                height={bh + 4}
                rx={3}
                fill="var(--aurora-cyan)"
                opacity={hover === null || hover === i ? 0.9 : 0.35}
              />
            );
          })}
        </g>

        {/* invisible full-height hover targets, wider than the marks */}
        {days.map((d, i) => (
          <rect
            key={`h-${d.date}`}
            x={PAD_L + i * step}
            y={0}
            width={step}
            height={BASE}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        <text x={PAD_L} y={H - 8} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-faint)">
          {fmt(days[0].date)}
        </text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-faint)">
          {fmt(days[days.length - 1].date)}
        </text>
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute -top-1 rounded-md border border-line bg-bg2 px-2.5 py-1.5 font-mono text-xs text-ink"
          style={{
            left: `${((PAD_L + (hover! + 0.5) * step) / W) * 100}%`,
            transform: "translateX(-50%)"
          }}
        >
          {hovered.date} <span className="text-faint">·</span>{" "}
          <span className="text-cyan">{hovered.count}</span> visits
        </div>
      ) : null}
    </div>
  );
}
