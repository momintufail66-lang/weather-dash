import type { ReactNode } from "react";
import {
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Hexagon,
  Sun,
  Sunrise,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  aqiLevel,
  compassPoint,
  formatClock,
  minutesOfDay,
  uvLevel,
  type WeatherReport,
} from "@/lib/weather";
import { cn } from "@/lib/utils";

function Card({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("glass flex min-h-44 flex-col rounded-[1.75rem] p-5", className)}>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="[&>svg]:size-3.5">{icon}</span>
        {title}
      </h3>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

function ScaleBar({ ratio }: { ratio: number }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div className="scale-bar relative mt-auto h-1 rounded-full">
      <span
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-foreground"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

function SunArc({ progress }: { progress: number }) {
  const t = Math.max(0, Math.min(1, progress));
  const x = (1 - t) ** 2 * 10 + 2 * (1 - t) * t * 100 + t ** 2 * 190;
  const y = (1 - t) ** 2 * 60 + 2 * (1 - t) * t * -20 + t ** 2 * 60;
  return (
    <svg viewBox="0 0 200 72" className="mt-2 w-full" aria-hidden>
      <line x1="0" y1="60" x2="200" y2="60" className="stroke-glass-border" strokeWidth="1" />
      <path d="M10 60 Q100 -20 190 60" fill="none" className="stroke-soft/50" strokeWidth="2.5" />
      <circle cx={x} cy={y} r="9" className="fill-foreground/20" />
      <circle cx={x} cy={y} r="5" className="fill-foreground" />
    </svg>
  );
}

function Compass({ degrees, speed }: { degrees: number; speed: number }) {
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <div className="relative mx-auto mt-1 size-36">
      <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
        {ticks.map((t) => (
          <line
            key={t}
            x1="60"
            y1="6"
            x2="60"
            y2={t % 90 === 0 ? "13" : "10"}
            transform={`rotate(${t} 60 60)`}
            className="stroke-muted-foreground/60"
            strokeWidth="1"
          />
        ))}
        {[
          ["N", 60, 24],
          ["E", 98, 63],
          ["S", 60, 102],
          ["W", 22, 63],
        ].map(([l, x, y]) => (
          <text key={l as string} x={x} y={y} textAnchor="middle" className="fill-foreground text-[9px] font-semibold">
            {l}
          </text>
        ))}
        <g transform={`rotate(${degrees} 60 60)`}>
          <line x1="60" y1="108" x2="60" y2="14" className="stroke-foreground" strokeWidth="2" strokeLinecap="round" />
          <polygon points="60,10 55,20 65,20" className="fill-foreground" />
          <circle cx="60" cy="106" r="3.5" className="fill-none stroke-foreground" strokeWidth="1.5" />
        </g>
      </svg>
      <div className="glass-strong absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center">
        <span className="text-base font-semibold leading-none">
          {Math.round(speed)}
          <span className="block text-[10px] font-normal text-muted-foreground">km/h</span>
        </span>
      </div>
    </div>
  );
}

export function DetailCards({ report }: { report: WeatherReport }) {
  const { current, today, airQuality } = report;
  const aq = airQuality ? aqiLevel(airQuality.usAqi) : null;

  const sunrise = minutesOfDay(today.sunrise);
  const sunset = minutesOfDay(today.sunset);
  const now = minutesOfDay(current.time);
  const dayProgress = (now - sunrise) / (sunset - sunrise);
  const isUp = now >= sunrise && now <= sunset;

  const feelsDiff = Math.round(current.feelsLike - current.temperature);
  const dewPoint = Math.round(
    current.temperature - (100 - current.humidity) / 5,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card icon={<Hexagon />} title="Air Quality" className="sm:col-span-2 xl:col-span-1">
        {airQuality && aq ? (
          <>
            <p className="text-2xl font-medium">
              {aq.level}-{aq.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              US AQI {Math.round(airQuality.usAqi)} · PM2.5 {airQuality.pm25.toFixed(1)} µg/m³ · PM10{" "}
              {airQuality.pm10.toFixed(1)} µg/m³
            </p>
            <div className="mt-5">
              <ScaleBar ratio={airQuality.usAqi / 300} />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Air quality data isn't available for this place right now.</p>
        )}
      </Card>

      <Card icon={<Sun />} title="UV Index">
        <p className="text-4xl font-light">{Math.round(current.uvIndex)}</p>
        <p className="text-lg font-medium">{uvLevel(current.uvIndex)}</p>
        <ScaleBar ratio={current.uvIndex / 11} />
      </Card>

      <Card icon={<Sunrise />} title={isUp ? "Sunset" : "Sunrise"}>
        <p className="text-3xl font-light">{formatClock(isUp ? today.sunset : today.sunrise)}</p>
        <SunArc progress={dayProgress} />
        <p className="mt-auto text-xs text-muted-foreground">
          {isUp ? `Sunrise: ${formatClock(today.sunrise)}` : `Sunset: ${formatClock(today.sunset)}`}
        </p>
      </Card>

      <Card icon={<Wind />} title="Wind">
        <Compass degrees={current.windDirection} speed={current.windSpeed} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          From {compassPoint(current.windDirection)} · Gusts {Math.round(current.windGusts)} km/h
        </p>
      </Card>

      <Card icon={<CloudRain />} title="Rainfall">
        <p className="text-3xl font-light">{today.rainfallMm.toFixed(1)} mm</p>
        <p className="text-lg font-medium">today</p>
        <p className="mt-auto text-xs text-muted-foreground">
          {current.precipitation > 0
            ? `${current.precipitation.toFixed(1)} mm falling right now.`
            : "No rain falling right now."}
        </p>
      </Card>

      <Card icon={<Thermometer />} title="Feels Like">
        <p className="text-4xl font-light">{Math.round(current.feelsLike)}°</p>
        <p className="mt-auto text-xs text-muted-foreground">
          {feelsDiff === 0
            ? "Similar to the actual temperature."
            : feelsDiff < 0
              ? "Wind is making it feel cooler."
              : "Humidity is making it feel warmer."}
        </p>
      </Card>

      <Card icon={<Droplets />} title="Humidity">
        <p className="text-4xl font-light">{Math.round(current.humidity)}%</p>
        <p className="mt-auto text-xs text-muted-foreground">The dew point is about {dewPoint}° right now.</p>
      </Card>

      <Card icon={<Eye />} title="Visibility">
        <p className="text-4xl font-light">{current.visibilityKm.toFixed(current.visibilityKm < 10 ? 1 : 0)} km</p>
        <p className="mt-auto text-xs text-muted-foreground">
          {current.visibilityKm >= 10 ? "It's perfectly clear right now." : "Haze or fog is reducing visibility."}
        </p>
      </Card>

      <Card icon={<Gauge />} title="Pressure">
        <p className="text-4xl font-light">{Math.round(current.pressure)}</p>
        <p className="text-lg font-medium">hPa</p>
        <ScaleBar ratio={(current.pressure - 960) / 90} />
      </Card>
    </div>
  );
}
