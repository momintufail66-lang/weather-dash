import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getWeather, WeatherError, type Place } from "@/lib/weather";

export function useWeather(place: Place) {
  return useQuery({
    queryKey: ["weather", place.latitude.toFixed(3), place.longitude.toFixed(3), place.name],
    queryFn: ({ signal }) => getWeather(place, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: (count, error) =>
      count < 1 && error instanceof WeatherError && (error.kind === "network" || error.kind === "timeout"),
  });
}
