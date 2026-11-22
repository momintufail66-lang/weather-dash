
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export type WeatherErrorKind = "network" | "timeout" | "http" | "not_found" | "parse";

export class WeatherError extends Error {
  kind: WeatherErrorKind;
  status?: number | undefined;
  constructor(kind: WeatherErrorKind, message: string, status?: number) {
    super(message);
    this.name = "WeatherError";
    this.kind = kind;
    this.status = status;
  }
}

export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string | undefined;
  admin1?: string | undefined;
}

export interface HourPoint {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  isDay: boolean;
}

export interface DayPoint {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  precipitationProbability: number;
}

export interface WeatherReport {
  place: Place;
  timezone: string;
  current: {
    time: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    isDay: boolean;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    pressure: number;
    uvIndex: number;
    visibilityKm: number;
  };
  today: {
    max: number;
    min: number;
    sunrise: string;
    sunset: string;
    rainfallMm: number;
  };
  hourly: HourPoint[];
  daily: DayPoint[];
  airQuality: { usAqi: number; pm25: number; pm10: number } | null;
}

interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function fetchJson<T>(url: string, { signal, timeoutMs = 10_000 }: FetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new WeatherError("timeout", "The weather service took too long to respond. Please try again.");
    }
    if (signal?.aborted) throw error;
    throw new WeatherError("network", "Couldn't reach the weather service. Check your internet connection.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!response.ok) {
    let reason = "";
    try {
      const body = (await response.json()) as { reason?: string };
      reason = body?.reason ?? "";
    } catch {
    }
    throw new WeatherError(
      "http",
      `The weather service returned an error (${response.status})${reason ? `: ${reason}` : ""}.`,
      response.status,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new WeatherError("parse", "The weather service sent data we couldn't read.");
  }
}

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
}

export async function searchCities(query: string, options?: FetchOptions): Promise<Place[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const params = new URLSearchParams({ name, count: "6", language: "en", format: "json" });
  const data = await fetchJson<GeocodingResponse>(`${GEOCODING_URL}?${params}`, options);
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }));
}

export async function findCity(query: string, options?: FetchOptions): Promise<Place> {
  const results = await searchCities(query, options);
  if (results.length === 0) {
    throw new WeatherError("not_found", `We couldn't find a city called "${query.trim()}".`);
  }
  return results[0]!;
}

interface ForecastResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    pressure_msl: number;
    uv_index: number;
    visibility: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: (number | null)[];
  };
}

interface AirQualityResponse {
  current?: { us_aqi?: number | null; pm2_5?: number | null; pm10?: number | null };
}

function assertForecastShape(data: unknown): asserts data is ForecastResponse {
  const d = data as Partial<ForecastResponse> | null;
  if (
    !d ||
    !d.current ||
    typeof d.current.temperature_2m !== "number" ||
    !Array.isArray(d.hourly?.time) ||
    !Array.isArray(d.daily?.time) ||
    d.daily.time.length === 0
  ) {
    throw new WeatherError("parse", "The weather service sent incomplete data for this place.");
  }
}

export async function getWeather(place: Place, options?: FetchOptions): Promise<WeatherReport> {
  const coords = { latitude: String(place.latitude), longitude: String(place.longitude), timezone: "auto" };
  const forecastParams = new URLSearchParams({
    ...coords,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,uv_index,visibility",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max",
    forecast_days: "7",
  });
  const airParams = new URLSearchParams({ ...coords, current: "us_aqi,pm2_5,pm10" });

  const [forecastResult, airResult] = await Promise.allSettled([
    fetchJson<unknown>(`${FORECAST_URL}?${forecastParams}`, options),
    fetchJson<AirQualityResponse>(`${AIR_QUALITY_URL}?${airParams}`, options),
  ]);

  if (forecastResult.status === "rejected") throw forecastResult.reason;
  const data = forecastResult.value;
  assertForecastShape(data);

  const { current, hourly, daily } = data;
  const currentHour = current.time.slice(0, 13);
  let startIndex = hourly.time.findIndex((t) => t.slice(0, 13) === currentHour);
  if (startIndex < 0) startIndex = 0;

  const hours: HourPoint[] = hourly.time.slice(startIndex, startIndex + 24).map((time, i) => {
    const idx = startIndex + i;
    return {
      time,
      temperature: hourly.temperature_2m[idx] ?? 0,
      weatherCode: hourly.weather_code[idx] ?? 0,
      precipitationProbability: hourly.precipitation_probability[idx] ?? 0,
      isDay: hourly.is_day[idx] === 1,
    };
  });

  const days: DayPoint[] = daily.time.map((date, i) => ({
    date,
    weatherCode: daily.weather_code[i] ?? 0,
    max: daily.temperature_2m_max[i] ?? 0,
    min: daily.temperature_2m_min[i] ?? 0,
    precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
  }));

  const aq = airResult.status === "fulfilled" ? airResult.value.current : undefined;

  return {
    place,
    timezone: data.timezone,
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      isDay: current.is_day === 1,
      precipitation: current.precipitation,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      windGusts: current.wind_gusts_10m,
      windDirection: current.wind_direction_10m,
      pressure: current.pressure_msl,
      uvIndex: current.uv_index ?? 0,
      visibilityKm: (current.visibility ?? 0) / 1000,
    },
    today: {
      max: daily.temperature_2m_max[0] ?? 0,
      min: daily.temperature_2m_min[0] ?? 0,
      sunrise: daily.sunrise[0] ?? `${daily.time[0]}T06:00`,
      sunset: daily.sunset[0] ?? `${daily.time[0]}T18:00`,
      rainfallMm: daily.precipitation_sum[0] ?? 0,
    },
    hourly: hours,
    daily: days,
    airQuality:
      aq && typeof aq.us_aqi === "number"
        ? { usAqi: aq.us_aqi, pm25: aq.pm2_5 ?? 0, pm10: aq.pm10 ?? 0 }
        : null,
  };
}

export type WeatherIcon = "sun" | "moon" | "partly" | "cloud" | "rain" | "snow" | "storm";

export function describeWeather(code: number, isDay = true): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: isDay ? "Sunny" : "Clear", icon: isDay ? "sun" : "moon" };
  if (code === 1) return { label: isDay ? "Mostly Sunny" : "Mostly Clear", icon: isDay ? "partly" : "moon" };
  if (code === 2) return { label: "Partly Cloudy", icon: isDay ? "partly" : "cloud" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Foggy", icon: "cloud" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "rain" };
  if (code === 61 || code === 80) return { label: "Light Rain", icon: "rain" };
  if (code === 63 || code === 81) return { label: "Mid Rain", icon: "rain" };
  if (code === 65 || code === 82) return { label: "Heavy Rain", icon: "rain" };
  if (code === 66 || code === 67) return { label: "Freezing Rain", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "Snow", icon: "snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "storm" };
  return { label: "Cloudy", icon: "cloud" };
}

export function aqiLevel(aqi: number): { level: number; label: string } {
  if (aqi <= 50) return { level: 1, label: "Good Air" };
  if (aqi <= 100) return { level: 2, label: "Moderate" };
  if (aqi <= 150) return { level: 3, label: "Low Health Risk" };
  if (aqi <= 200) return { level: 4, label: "Unhealthy" };
  if (aqi <= 300) return { level: 5, label: "Very Unhealthy" };
  return { level: 6, label: "Hazardous" };
}

export function uvLevel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function compassPoint(degrees: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round((((degrees % 360) + 360) % 360) / 45) % 8]!;
}

export function formatClock(isoLocal: string): string {
  const [h = 0, m = 0] = isoLocal.slice(11, 16).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatHour(isoLocal: string): string {
  const h = Number(isoLocal.slice(11, 13));
  return `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? "PM" : "AM"}`;
}

export function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function minutesOfDay(isoLocal: string): number {
  const [h = 0, m = 0] = isoLocal.slice(11, 16).split(":").map(Number);
  return h * 60 + m;
}

export const DEFAULT_PLACE: Place = {
  id: 6077243,
  name: "Montreal",
  latitude: 45.50884,
  longitude: -73.58781,
  country: "Canada",
  admin1: "Quebec",
};

export async function nameForCoordinates(latitude: number, longitude: number): Promise<Place> {
  const fallback: Place = { id: 0, name: "Your Location", latitude, longitude };
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "en",
    });
    const data = await fetchJson<{ city?: string; locality?: string; principalSubdivision?: string; countryName?: string }>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
      { timeoutMs: 6000 },
    );
    const name = data.city || data.locality;
    if (!name) return fallback;
    return { ...fallback, name, admin1: data.principalSubdivision, country: data.countryName };
  } catch {
    return fallback;
  }
}

export interface CitySnapshot {
  place: Place;
  localTime: string;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
  max: number;
  min: number;
}

interface MultiForecastItem {
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
}

export async function getCitiesWeather(places: Place[], options?: FetchOptions): Promise<CitySnapshot[]> {
  if (places.length === 0) return [];
  const params = new URLSearchParams({
    latitude: places.map((p) => p.latitude).join(","),
    longitude: places.map((p) => p.longitude).join(","),
    current: "temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "1",
    timezone: "auto",
  });
  const data = await fetchJson<MultiForecastItem | MultiForecastItem[]>(`${FORECAST_URL}?${params}`, options);
  const items = Array.isArray(data) ? data : [data];
  if (items.length !== places.length) {
    throw new WeatherError("parse", "The weather service sent data for the wrong number of cities.");
  }
  return items.map((item, i) => {
    const c = item.current;
    if (!c || typeof c.temperature_2m !== "number" || typeof c.time !== "string") {
      throw new WeatherError("parse", "The weather service sent incomplete data for one of the cities.");
    }
    return {
      place: places[i]!,
      localTime: c.time,
      temperature: c.temperature_2m,
      weatherCode: c.weather_code ?? 0,
      isDay: c.is_day === 1,
      humidity: c.relative_humidity_2m ?? 0,
      windSpeed: c.wind_speed_10m ?? 0,
      max: item.daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
      min: item.daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
    };
  });
}

export const POPULAR_CITIES: Place[] = [
  DEFAULT_PLACE,
  { id: 1850147, name: "Tokyo", latitude: 35.6895, longitude: 139.69171, admin1: "Tokyo", country: "Japan" },
  { id: 1273294, name: "Delhi", latitude: 28.65195, longitude: 77.23149, admin1: "Delhi", country: "India" },
  { id: 1275339, name: "Mumbai", latitude: 19.07283, longitude: 72.88261, admin1: "Maharashtra", country: "India" },
  { id: 2643743, name: "London", latitude: 51.50853, longitude: -0.12574, admin1: "England", country: "United Kingdom" },
  { id: 5128581, name: "New York", latitude: 40.71427, longitude: -74.00597, admin1: "New York", country: "United States" },
  { id: 2988507, name: "Paris", latitude: 48.85341, longitude: 2.3488, admin1: "Île-de-France", country: "France" },
  { id: 292223, name: "Dubai", latitude: 25.07725, longitude: 55.30927, admin1: "Dubai", country: "United Arab Emirates" },
  { id: 2147714, name: "Sydney", latitude: -33.86785, longitude: 151.20732, admin1: "New South Wales", country: "Australia" },
  { id: 1880252, name: "Singapore", latitude: 1.28967, longitude: 103.85007, country: "Singapore" },
  { id: 3448439, name: "São Paulo", latitude: -23.5475, longitude: -46.63611, admin1: "São Paulo", country: "Brazil" },
  { id: 360630, name: "Cairo", latitude: 30.06263, longitude: 31.24967, admin1: "Cairo", country: "Egypt" },
];
