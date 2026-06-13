import { WORLD_W, WORLD_H, hash01 } from "./layout";

// Static night-over-Gotham backdrop: distant stars, drifting haze, a procedural
// skyline and a slow bat-signal sweep. Lives on the parallax (far) layer.
export default function Backdrop() {
  const dots = Array.from({ length: 260 }, (_, i) => {
    const r1 = hash01(`bgx${i}`);
    const r2 = hash01(`bgy${i}`);
    const r3 = hash01(`bgs${i}`);
    return {
      x: r1 * WORLD_W,
      y: r2 * WORLD_H * 0.82,
      r: 0.6 + r3 * 1.7,
      tw: r3 > 0.72,
      delay: r1 * 5,
      dur: 3 + r2 * 4
    };
  });

  const buildings = (() => {
    const out: { x: number; w: number; h: number; i: number }[] = [];
    let x = -40;
    let i = 0;
    while (x < WORLD_W + 80) {
      const w = 70 + hash01(`bw${i}`) * 160;
      const h = 90 + hash01(`bh${i}`) * 270;
      out.push({ x, w, h, i });
      x += w + 6 + hash01(`bg${i}`) * 30;
      i += 1;
    }
    return out;
  })();

  const signalX = WORLD_W * 0.42;

  return (
    <div
      className="absolute inset-0"
      style={{
        width: WORLD_W,
        height: WORLD_H,
        background:
          "radial-gradient(ellipse 70% 55% at 50% 18%, #0b1626 0%, #070d18 45%, #04060c 100%)"
      }}
    >
      <svg width={WORLD_W} height={WORLD_H} className="absolute inset-0">
        {dots.map((d, i) => (
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
        <circle cx={WORLD_W * 0.78} cy={WORLD_H * 0.12} r={170} fill="#dce8f5" opacity={0.05} />
        <circle cx={WORLD_W * 0.78} cy={WORLD_H * 0.12} r={86} fill="#e8f1fa" opacity={0.1} />

        {/* bat-signal sweep */}
        <g style={{ transformOrigin: `${signalX}px ${WORLD_H - 290}px` }} className="signal-sweep">
          <polygon
            points={`${signalX - 14},${WORLD_H - 290} ${signalX - 210},${WORLD_H * 0.07} ${signalX + 260},${WORLD_H * 0.1}`}
            fill="url(#beam)"
          />
          <ellipse
            cx={signalX + 25}
            cy={WORLD_H * 0.09}
            rx={190}
            ry={60}
            fill="#f6e9b8"
            opacity={0.07}
          />
        </g>
        <defs>
          <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f6e9b8" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#f6e9b8" stopOpacity="0.14" />
          </linearGradient>
        </defs>

        {/* skyline */}
        <g>
          {buildings.map((b) => (
            <g key={b.i}>
              <rect
                x={b.x}
                y={WORLD_H - b.h}
                width={b.w}
                height={b.h}
                fill="#05080f"
              />
              {Array.from({ length: Math.floor((b.w / 18) * (b.h / 26)) }, (_, wi) => {
                const col = wi % Math.max(1, Math.floor(b.w / 18));
                const row = Math.floor(wi / Math.max(1, Math.floor(b.w / 18)));
                const lit = hash01(`win${b.i}-${wi}`) > 0.93;
                if (!lit) return null;
                return (
                  <rect
                    key={wi}
                    x={b.x + 6 + col * 18}
                    y={WORLD_H - b.h + 10 + row * 26}
                    width={7}
                    height={10}
                    fill="#e8c66a"
                    opacity={0.55}
                  />
                );
              })}
            </g>
          ))}
          {/* wayne tower spire */}
          <rect x={signalX - 60} y={WORLD_H - 420} width={120} height={420} fill="#04070d" />
          <polygon
            points={`${signalX - 60},${WORLD_H - 420} ${signalX},${WORLD_H - 520} ${signalX + 60},${WORLD_H - 420}`}
            fill="#04070d"
          />
        </g>
      </svg>
    </div>
  );
}
