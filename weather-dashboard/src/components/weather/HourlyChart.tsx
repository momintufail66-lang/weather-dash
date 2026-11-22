import { formatHour, type HourPoint } from "@/lib/weather";
import { cn } from "@/lib/utils";
import { WeatherIcon } from "./WeatherIcon";

const COL = 60;
const H = 120;
const PAD = 26;

function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function HourlyChart({ hours }: { hours: HourPoint[] }) {
  const temps = hours.map((h) => h.temperature);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const span = Math.max(max - min, 1);
  const width = hours.length * COL;
  const pts = hours.map((h, i): [number, number] => [
    i * COL + COL / 2,
    PAD + ((max - h.temperature) / span) * (H - PAD * 2),
  ]);
  const line = smoothPath(pts);
  const area = `${line} L ${width - COL / 2} ${H} L ${COL / 2} ${H} Z`;

  return (
    <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
      <div style={{ width }} className="relative">
        <svg viewBox={`0 0 ${width} ${H}`} width={width} height={H} className="block" aria-hidden>
          <defs>
            <linearGradient id="temp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--soft)", stopOpacity: 0.35 }} />
              <stop offset="100%" style={{ stopColor: "var(--soft)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#temp-area)" />
          <path d={line} fill="none" stroke="var(--soft)" strokeWidth={2.5} strokeLinecap="round" />
          {pts.map(([x, y], i) => (
            <g key={hours[i]!.time}>
              <circle cx={x} cy={y} r={i === 0 ? 5 : 3} fill="var(--foreground)" />
              <text x={x} y={y - 10} textAnchor="middle" fontSize={13} fill="var(--foreground)">
                {Math.round(hours[i]!.temperature)}°
              </text>
            </g>
          ))}
        </svg>
        <ul className="mt-2 flex">
          {hours.map((h, i) => (
            <li key={h.time} style={{ width: COL }} className="flex shrink-0 flex-col items-center gap-1.5">
              <WeatherIcon code={h.weatherCode} isDay={h.isDay} className="size-8" />
              <div className="flex h-10 w-2 items-end overflow-hidden rounded-full bg-glass">
                <div className="w-full rounded-full bg-rain" style={{ height: `${Math.max(h.precipitationProbability, 4)}%` }} />
              </div>
              <span className={cn("text-xs font-semibold text-rain", h.precipitationProbability < 10 && "text-muted-foreground")}>
                {h.precipitationProbability}%
              </span>
              <span className={cn("text-xs", i === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {i === 0 ? "Now" : formatHour(h.time)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
