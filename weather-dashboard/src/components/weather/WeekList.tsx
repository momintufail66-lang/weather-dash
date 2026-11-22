import { describeWeather, formatWeekday, type DayPoint } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

export function WeekList({ days }: { days: DayPoint[] }) {
  const low = Math.min(...days.map((d) => d.min));
  const high = Math.max(...days.map((d) => d.max));
  const span = Math.max(high - low, 1);

  return (
    <ul className="divide-y divide-glass-border">
      {days.map((d, i) => {
        const left = ((d.min - low) / span) * 100;
        const right = ((high - d.max) / span) * 100;
        return (
          <li key={d.date} className="flex items-center gap-3 py-3.5 sm:gap-4">
            <span className="w-12 shrink-0 text-sm font-semibold sm:w-14">{i === 0 ? "Today" : formatWeekday(d.date)}</span>
            <WeatherIcon code={d.weatherCode} className="size-9 shrink-0" />
            <span className="hidden w-32 shrink-0 truncate text-sm text-muted-foreground md:block">
              {describeWeather(d.weatherCode).label}
            </span>
            <span className="w-10 shrink-0 text-xs font-semibold text-rain">
              {d.precipitationProbability >= 10 ? `${d.precipitationProbability}%` : ""}
            </span>
            <span className="w-9 shrink-0 text-right text-sm text-muted-foreground">{Math.round(d.min)}°</span>
            <span className="relative h-1.5 min-w-0 flex-1 rounded-full bg-glass">
              <span className="temp-range absolute inset-y-0 rounded-full" style={{ left: `${left}%`, right: `${right}%` }} />
            </span>
            <span className="w-9 shrink-0 text-sm font-semibold">{Math.round(d.max)}°</span>
          </li>
        );
      })}
    </ul>
  );
}
