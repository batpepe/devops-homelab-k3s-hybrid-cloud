import { hash01 } from "./layout";

// Full-bleed night-over-Gotham backdrop. Two slice-scaled SVG layers always
// cover the viewport (no visible edges) on any screen, phone to ultrawide:
// a starfield/haze layer and a bottom-anchored skyline. It is static (does not
// pan with the constellation), so its edges can never scroll into view.
const SKY_W = 1600;
const SKY_H = 1000;
const CITY_W = 1600;
const CITY_H = 460;

export default function Backdrop() {
  const stars = Array.from({ length: 170 }, (_, i) => {
    const r1 = hash01(`bgx${i}`);
    const r2 = hash01(`bgy${i}`);
    const r3 = hash01(`bgs${i}`);
    return {
      x: r1 * SKY_W,
      y: r2 * SKY_H * 0.86,
      r: 0.8 + r3 * 1.7,
      tw: r3 > 0.7,
      delay: r1 * 5,
      dur: 3 + r2 * 4
    };
  });

  const buildings = (() => {
    const out: { x: number; w: number; h: number; i: number }[] = [];
    let x = -30;
    let i = 0;
    while (x < CITY_W + 60) {
      const w = 55 + hash01(`bw${i}`) * 150;
      const h = 110 + hash01(`bh${i}`) * 320;
      out.push({ x, w, h, i });
      x += w + 5 + hash01(`bg${i}`) * 26;
      i += 1;
    }
    return out;
  })();

  const signalX = SKY_W * 0.5;

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 90% 60% at 50% 12%, #0b1626 0%, #070d18 45%, #04060c 100%)"
      }}
    >
      {/* starfield + haze + bat-signal: always covers the viewport */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill="#cfe2f3"
            opacity={0.5}
            className={d.tw ? "twinkle" : undefined}
            style={d.tw ? { animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` } : undefined}
          />
        ))}

        {/* moon haze */}
        <circle cx={SKY_W * 0.8} cy={SKY_H * 0.16} r={120} fill="#dce8f5" opacity={0.05} />
        <circle cx={SKY_W * 0.8} cy={SKY_H * 0.16} r={60} fill="#e8f1fa" opacity={0.1} />

        {/* bat-signal sweep */}
        <g style={{ transformOrigin: `${signalX}px ${SKY_H}px` }} className="signal-sweep">
          <polygon
            points={`${signalX - 18},${SKY_H} ${signalX - 230},${SKY_H * 0.06} ${signalX + 280},${SKY_H * 0.1}`}
            fill="url(#beam)"
          />
          <ellipse cx={signalX + 30} cy={SKY_H * 0.08} rx={210} ry={66} fill="#f6e9b8" opacity={0.06} />
        </g>
        <defs>
          <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f6e9b8" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#f6e9b8" stopOpacity="0.13" />
          </linearGradient>
        </defs>
      </svg>

      {/* skyline anchored to the bottom edge on any aspect ratio */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: "46vh" }}
        viewBox={`0 0 ${CITY_W} ${CITY_H}`}
        preserveAspectRatio="xMidYMax slice"
      >
        {buildings.map((b) => (
          <g key={b.i}>
            <rect x={b.x} y={CITY_H - b.h} width={b.w} height={b.h} fill="#05080f" />
            {Array.from({ length: Math.floor((b.w / 16) * (b.h / 24)) }, (_, wi) => {
              const cols = Math.max(1, Math.floor(b.w / 16));
              const col = wi % cols;
              const row = Math.floor(wi / cols);
              if (hash01(`win${b.i}-${wi}`) <= 0.93) return null;
              return (
                <rect
                  key={wi}
                  x={b.x + 5 + col * 16}
                  y={CITY_H - b.h + 9 + row * 24}
                  width={6}
                  height={9}
                  fill="#e8c66a"
                  opacity={0.55}
                />
              );
            })}
          </g>
        ))}
        {/* wayne tower spire, centred under the signal */}
        <rect x={CITY_W * 0.5 - 55} y={CITY_H - 440} width={110} height={440} fill="#04070d" />
        <polygon
          points={`${CITY_W * 0.5 - 55},${CITY_H - 440} ${CITY_W * 0.5},${CITY_H - 520} ${CITY_W * 0.5 + 55},${CITY_H - 440}`}
          fill="#04070d"
        />
      </svg>
    </div>
  );
}
