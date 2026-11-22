import house from "@/assets/night-house.webp";
import { describeWeather, type WeatherReport } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

export function HeroPanel({ report }: { report: WeatherReport }) {
  const { place, current, today } = report;
  const { label } = describeWeather(current.weatherCode, current.isDay);
  const region = [place.admin1, place.country].filter(Boolean).join(", ");

  return (
    <section className="relative flex flex-col px-4 pb-0 pt-6 text-center">
      <div className="relative">
        <h1 className="font-display text-4xl font-normal tracking-tight">{place.name}</h1>
        {region && <p className="mt-1 text-sm text-muted-foreground">{region}</p>}
        <div className="mx-auto mt-4 flex w-fit items-start justify-center">
          <span className="font-display text-[6rem] font-extralight sm:text-[7.5rem] leading-none tracking-tighter">
            {Math.round(current.temperature)}°
          </span>
          <WeatherIcon
            code={current.weatherCode}
            isDay={current.isDay}
            className="animate-float -mr-6 mt-3 size-16 shrink-0 sm:-mr-8 sm:mt-4 sm:size-20"
          />
        </div>
        <p className="mt-2 text-xl font-medium text-soft">{label}</p>
        <p className="mt-1 text-lg font-medium">
          H:{Math.round(today.max)}° &nbsp; L:{Math.round(today.min)}°
        </p>
      </div>
      <img
        src={house}
        alt="Cozy house glowing at night"
        width={800}
        height={800}
        className="icon-shadow relative mx-auto -mb-6 mt-4 w-full max-w-[340px]"
      />
    </section>
  );
}
