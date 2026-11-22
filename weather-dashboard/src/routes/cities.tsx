import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Wind } from "lucide-react";
import { describeWeather, formatClock, getCitiesWeather, POPULAR_CITIES, type CitySnapshot } from "@/lib/weather";
import { placeFromSearch, samePlace, searchFromPlace } from "@/lib/place-search";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import { ErrorPanel } from "@/components/weather/StatusPanels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cities")({
  head: () => ({
    meta: [
      { title: "World Cities — Weather Dashboard" },
      { name: "description", content: "Live temperature and conditions in major cities around the world, side by side." },
      { property: "og:title", content: "World Cities — Weather Dashboard" },
      { property: "og:description", content: "Compare the weather right now in Tokyo, Delhi, London, New York and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CitiesPage,
});

function CitiesPage() {
  const selected = placeFromSearch(Route.useSearch());
  const cities = useQuery({
    queryKey: ["cities", POPULAR_CITIES.map((p) => p.id).join(",")],
    queryFn: ({ signal }) => getCitiesWeather(POPULAR_CITIES, { signal }),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  return (
    <main>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-normal sm:text-4xl">World cities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live conditions right now. Tap a city to open its dashboard.</p>
      </div>

      {cities.data ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cities.data.map((c) => (
            <li key={c.place.id}>
              <CityCard city={c} active={samePlace(c.place, selected)} />
            </li>
          ))}
        </ul>
      ) : cities.isError ? (
        <ErrorPanel error={cities.error} onRetry={() => cities.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading cities">
          {POPULAR_CITIES.map((p) => (
            <div key={p.id} className="glass h-52 animate-pulse rounded-[2rem]" />
          ))}
        </div>
      )}
    </main>
  );
}

function CityCard({ city, active }: { city: CitySnapshot; active: boolean }) {
  const { place } = city;
  return (
    <Link
      to="/"
      search={searchFromPlace(place)}
      className={cn(
        "glass group flex h-full flex-col rounded-[2rem] p-5 transition-transform hover:-translate-y-1",
        active && "hero-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{place.name}</p>
          <p className="truncate text-xs text-muted-foreground">{place.country}</p>
        </div>
        <span className="shrink-0 rounded-full bg-glass px-2.5 py-1 text-xs text-muted-foreground">
          {formatClock(city.localTime)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-display text-5xl font-extralight">{Math.round(city.temperature)}°</span>
        <WeatherIcon code={city.weatherCode} isDay={city.isDay} className="size-16 transition-transform group-hover:scale-110" />
      </div>
      <p className="mt-1 text-sm font-medium text-soft">{describeWeather(city.weatherCode, city.isDay).label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-glass-border pt-3 text-xs text-muted-foreground">
        <span>
          H:{Math.round(city.max)}° L:{Math.round(city.min)}°
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="size-3.5" /> {city.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="size-3.5" /> {Math.round(city.windSpeed)} km/h
        </span>
      </div>
    </Link>
  );
}
