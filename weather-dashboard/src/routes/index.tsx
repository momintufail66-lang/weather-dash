import { createFileRoute } from "@tanstack/react-router";
import { placeFromSearch } from "@/lib/place-search";
import { useWeather } from "@/hooks/use-weather";
import { HeroPanel } from "@/components/weather/HeroPanel";
import { ForecastPanel } from "@/components/weather/ForecastPanel";
import { DetailCards } from "@/components/weather/DetailCards";
import { DashboardSkeleton, ErrorPanel, StaleBanner } from "@/components/weather/StatusPanels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Dashboard — Live Weather for Any City" },
      {
        name: "description",
        content: "Live temperature, humidity, wind, air quality and forecasts for any city in the world.",
      },
      { property: "og:title", content: "Weather Dashboard — Live Weather for Any City" },
      {
        property: "og:description",
        content: "Search any city for live temperature, humidity, wind speed, air quality and a 7-day forecast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const place = placeFromSearch(Route.useSearch());
  const weather = useWeather(place);
  const report = weather.data;

  return (
    <>
      {weather.isError && report && (
        <StaleBanner placeName={place.name} error={weather.error} onRetry={() => weather.refetch()} />
      )}
      {report ? (
        <main className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr] xl:grid-cols-[minmax(0,400px)_1fr]">
          <div className="lg:sticky lg:top-28">
            <HeroPanel report={report} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <ForecastPanel report={report} />
            <DetailCards report={report} />
          </div>
        </main>
      ) : weather.isError ? (
        <ErrorPanel error={weather.error} onRetry={() => weather.refetch()} />
      ) : (
        <DashboardSkeleton />
      )}
    </>
  );
}
