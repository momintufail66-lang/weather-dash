import type { Place } from "@/lib/weather";
import { samePlace } from "@/lib/place-search";

const KEY = "weather-dashboard:recent-cities";
const MAX = 5;

export function loadRecentCities(): Place[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (p): p is Place =>
        !!p && typeof p.name === "string" && typeof p.latitude === "number" && typeof p.longitude === "number",
    );
  } catch {
    return [];
  }
}

export function addRecentCity(place: Place): Place[] {
  const next = [place, ...loadRecentCities().filter((p) => !samePlace(p, place))].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
  return next;
}
