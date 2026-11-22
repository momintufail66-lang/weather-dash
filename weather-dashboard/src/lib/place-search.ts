import { DEFAULT_PLACE, type Place } from "@/lib/weather";

export interface PlaceSearch {
  city?: string | undefined;
  lat?: number | undefined;
  lon?: number | undefined;
  region?: string | undefined;
  country?: string | undefined;
}

export function parsePlaceSearch(search: Record<string, unknown>): PlaceSearch {
  const lat = Number(search["lat"]);
  const lon = Number(search["lon"]);
  if (typeof search["city"] !== "string" || !Number.isFinite(lat) || !Number.isFinite(lon)) return {};
  return {
    city: search["city"],
    lat,
    lon,
    region: typeof search["region"] === "string" ? search["region"] : undefined,
    country: typeof search["country"] === "string" ? search["country"] : undefined,
  };
}

export function placeFromSearch(search: PlaceSearch): Place {
  if (!search.city || search.lat === undefined || search.lon === undefined) return DEFAULT_PLACE;
  return {
    id: 0,
    name: search.city,
    latitude: search.lat,
    longitude: search.lon,
    admin1: search.region,
    country: search.country,
  };
}

export function searchFromPlace(p: Place): PlaceSearch {
  return { city: p.name, lat: p.latitude, lon: p.longitude, region: p.admin1, country: p.country };
}

export function samePlace(a: Place, b: Place): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}
