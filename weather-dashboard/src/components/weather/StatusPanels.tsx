import { AlertTriangle, RefreshCw, SearchX, WifiOff } from "lucide-react";
import type { WeatherError } from "@/lib/weather";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]" aria-busy="true" aria-label="Loading weather">
      <div className="glass-strong h-[560px] animate-pulse rounded-[2.5rem]" />
      <div className="flex flex-col gap-4">
        <div className="glass h-60 animate-pulse rounded-[2rem]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass h-44 animate-pulse rounded-[1.75rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorPanel({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const kind = (error as WeatherError).kind;
  const Icon = kind === "network" || kind === "timeout" ? WifiOff : kind === "not_found" ? SearchX : AlertTriangle;
  const title =
    kind === "network"
      ? "You're offline"
      : kind === "timeout"
        ? "That took too long"
        : kind === "not_found"
          ? "City not found"
          : "Weather unavailable";

  return (
    <div role="alert" className="glass-strong mx-auto flex max-w-lg flex-col items-center rounded-[2.5rem] px-8 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-5 text-2xl font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={onRetry}
        className="pill-active mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold"
      >
        <RefreshCw className="size-4" /> Try again
      </button>
    </div>
  );
}

export function StaleBanner({ placeName, error, onRetry }: { placeName: string; error: Error; onRetry: () => void }) {
  return (
    <div role="status" className="glass mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl px-5 py-3 text-sm">
      <span>
        Couldn't update the weather for {placeName}. {error.message}
      </span>
      <button onClick={onRetry} className="font-semibold underline underline-offset-4">
        Try again
      </button>
    </div>
  );
}
