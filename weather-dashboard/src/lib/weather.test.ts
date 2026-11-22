import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PLACE, findCity, getWeather, WeatherError } from "./weather";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("weather fetching error handling", () => {
  it("reports a not_found error when a searched city doesn't exist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ generationtime_ms: 0.1 })));
    await expect(findCity("Qwxzzz")).rejects.toMatchObject({ kind: "not_found" });
  });

  it("reports a network error when the request can't be sent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(getWeather(DEFAULT_PLACE)).rejects.toMatchObject({ kind: "network" });
  });

  it("reports an http error with the status when the service fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: true, reason: "Bad coordinates" }, 400)));
    const error = await getWeather(DEFAULT_PLACE).catch((e) => e);
    expect(error).toBeInstanceOf(WeatherError);
    expect(error.status).toBe(400);
    expect(error.message).toContain("Bad coordinates");
  });

  it("reports a parse error when the forecast is missing nested data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ current: {} })));
    await expect(getWeather(DEFAULT_PLACE)).rejects.toMatchObject({ kind: "parse" });
  });

  it("still returns the forecast when only air quality fails", async () => {
    const forecast = {
      timezone: "America/Toronto",
      current: {
        time: "2026-11-19T12:15", temperature_2m: 10.4, relative_humidity_2m: 72, apparent_temperature: 7.4,
        is_day: 1, precipitation: 0, weather_code: 3, wind_speed_10m: 13.9, wind_direction_10m: 231,
        wind_gusts_10m: 28.8, pressure_msl: 1025.5, uv_index: 2.2, visibility: 24500,
      },
      hourly: {
        time: ["2026-11-19T11:00", "2026-11-19T12:00", "2026-11-19T13:00"],
        temperature_2m: [9, 10, 11], weather_code: [3, 3, 61], precipitation_probability: [0, 10, 40], is_day: [1, 1, 1],
      },
      daily: {
        time: ["2026-11-19"], weather_code: [3], temperature_2m_max: [12], temperature_2m_min: [4],
        sunrise: ["2026-11-19T06:58"], sunset: ["2026-11-19T16:20"], precipitation_sum: [1.8],
        precipitation_probability_max: [40],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => (url.includes("air-quality") ? json({}, 503) : json(forecast))),
    );
    const report = await getWeather(DEFAULT_PLACE);
    expect(report.airQuality).toBeNull();
    expect(report.current.humidity).toBe(72);
    expect(report.current.windSpeed).toBe(13.9);
    expect(report.hourly[0]?.time).toBe("2026-11-19T12:00");
    expect(report.current.visibilityKm).toBe(24.5);
  });
});
