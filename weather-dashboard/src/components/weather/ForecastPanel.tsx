import { useState } from "react";
import { formatHour, formatWeekday, type WeatherReport } from "@/lib/weather";
import { cn } from "@/lib/utils";
import { WeatherIcon } from "./WeatherIcon";

type Tab = "hourly" | "weekly";

export function ForecastPanel({ report }: { report: WeatherReport }) {
  const [tab, setTab] = useState<Tab>("hourly");

  const items =
    tab === "hourly"
      ? report.hourly.map((h, i) => ({
          key: h.time,
          label: i === 0 ? "Now" : formatHour(h.time),
          code: h.weatherCode,
          isDay: h.isDay,
          chance: h.precipitationProbability,
          temp: `${Math.round(h.temperature)}°`,
          active: i === 0,
        }))
      : report.daily.map((d, i) => ({
          key: d.date,
          label: i === 0 ? "Today" : formatWeekday(d.date),
          code: d.weatherCode,
          isDay: true,
          chance: d.precipitationProbability,
          temp: `${Math.round(d.max)}°`,
          low: `${Math.round(d.min)}°`,
          active: i === 0,
        }));

  return (
    <section className="glass rounded-[2rem] pb-5 pt-3">
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-foreground/25" aria-hidden />
      <div role="tablist" className="flex justify-between border-b border-glass-border px-6">
        {(["hourly", "weekly"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors",
              tab === t
                ? "border-soft text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "hourly" ? "Hourly Forecast" : "Weekly Forecast"}
          </button>
        ))}
      </div>
      <ul className="no-scrollbar mt-5 flex gap-3 overflow-x-auto px-6">
        {items.map((it) => (
          <li
            key={it.key}
            className={cn(
              "flex h-40 w-[4.25rem] shrink-0 flex-col items-center justify-between rounded-full border border-glass-border bg-glass py-4",
              it.active && "pill-active",
            )}
          >
            <span className="text-sm font-semibold">{it.label}</span>
            <span className="flex flex-col items-center">
              <WeatherIcon code={it.code} isDay={it.isDay} className="size-9" />
              <span className={cn("h-4 text-xs font-semibold text-rain", it.chance < 20 && "invisible")}>
                {it.chance}%
              </span>
            </span>
            <span className="text-center text-lg leading-tight">
              {it.temp}
              {"low" in it && typeof it.low === "string" && (
                <span className="block text-xs text-muted-foreground">{it.low}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
