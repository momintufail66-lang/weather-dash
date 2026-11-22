import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Snowflake, Sun } from "lucide-react";
import { describeWeather, formatWeekday, type WeatherReport } from "@/lib/weather";
import { placeFromSearch } from "@/lib/place-search";
import { useWeather } from "@/hooks/use-weather";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import { HourlyChart } from "@/components/weather/HourlyChart";
import { WeekList } from "@/components/weather/WeekList";
import { ErrorPanel, StaleBanner } from "@/components/weather/StatusPanels";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Forecast — Weather Dashboard" },
      { name: "description", content: "Hour-by-hour temperature and rain chances plus a 7-day forecast for any city." },
      { property: "og:title", content: "Forecast — Weather Dashboard" },
      { property: "og:description", content: "Next 24 hours and the week ahead for any city, updated live." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const place = placeFromSearch(Route.useSearch());
  const weather = useWeather(place);
  const report = weather.data;

  if (!report) {
    return weather.isError ? (
      <ErrorPanel error={weather.error} onRetry={() => weather.refetch()} />
    ) : (
      <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading forecast">
        <div className="glass-strong h-36 animate-pulse rounded-[2rem]" />
        <div className="glass h-80 animate-pulse rounded-[2rem]" />
        <div className="glass h-96 animate-pulse rounded-[2rem]" />
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-5">
      {weather.isError && <StaleBanner placeName={place.name} error={weather.error} onRetry={() => weather.refetch()} />}
      <Summary report={report} />

      <section className="glass rounded-[2rem] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Next 24 hours</h2>
        <HourlyChart hours={report.hourly} />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_minmax(0,320px)]">
        <section className="glass rounded-[2rem] px-5 py-4 sm:px-6">
          <h2 className="pt-1 font-display text-lg font-medium">7-day forecast</h2>
          <WeekList days={report.daily} />
        </section>
        <Highlights report={report} />
      </div>
    </main>
  );
}

function Summary({ report }: { report: WeatherReport }) {
  const { place, current, today } = report;
  const region = [place.admin1, place.country].filter(Boolean).join(", ");
  return (
    <section className="glass-strong relative flex items-center gap-4 overflow-hidden rounded-[2rem] p-5 sm:gap-6 sm:p-7">
      <div className="starfield pointer-events-none absolute inset-0" aria-hidden />
      <WeatherIcon code={current.weatherCode} isDay={current.isDay} className="relative size-16 shrink-0 sm:size-24" />
      <div className="relative min-w-0 flex-1">
        <h1 className="truncate font-display text-2xl font-normal sm:text-4xl">{place.name} forecast</h1>
        {region && <p className="truncate text-sm text-muted-foreground">{region}</p>}
        <p className="mt-1 text-sm text-soft sm:text-base">
          {describeWeather(current.weatherCode, current.isDay).label} · H:{Math.round(today.max)}° L:{Math.round(today.min)}°
        </p>
      </div>
      <span className="relative shrink-0 font-display text-5xl font-extralight sm:text-7xl">
        {Math.round(current.temperature)}°
      </span>
    </section>
  );
}

function Highlights({ report }: { report: WeatherReport }) {
  const days = report.daily;
  const warmest = days.reduce((a, b) => (b.max > a.max ? b : a));
  const coldest = days.reduce((a, b) => (b.min < a.min ? b : a));
  const wettest = days.reduce((a, b) => (b.precipitationProbability > a.precipitationProbability ? b : a));
  const items = [
    { icon: Sun, title: "Warmest day", value: `${Math.round(warmest.max)}°`, day: warmest.date, tone: "text-sun" },
    { icon: Snowflake, title: "Coldest night", value: `${Math.round(coldest.min)}°`, day: coldest.date, tone: "text-soft" },
    {
      icon: CloudRain,
      title: "Best chance of rain",
      value: `${wettest.precipitationProbability}%`,
      day: wettest.date,
      tone: "text-rain",
    },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
      {items.map(({ icon: Icon, title, value, day, tone }) => (
        <div key={title} className="glass flex items-center gap-4 rounded-[1.75rem] p-5">
          <span className="glass grid size-12 shrink-0 place-items-center rounded-2xl">
            <Icon className={`size-5 ${tone}`} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="font-display text-2xl">
              {value} <span className="text-sm text-muted-foreground">{formatWeekday(day)}</span>
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
