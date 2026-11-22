import sun from "@/assets/weather/sun.webp";
import moon from "@/assets/weather/moon.webp";
import partly from "@/assets/weather/partly.webp";
import cloud from "@/assets/weather/cloud.webp";
import rain from "@/assets/weather/rain.webp";
import snow from "@/assets/weather/snow.webp";
import storm from "@/assets/weather/storm.webp";
import { describeWeather, type WeatherIcon as IconKey } from "@/lib/weather";
import { cn } from "@/lib/utils";

const ICONS: Record<IconKey, string> = {
  sun: sun,
  moon: moon,
  partly: partly,
  cloud: cloud,
  rain: rain,
  snow: snow,
  storm: storm,
};

export function WeatherIcon({
  code,
  isDay = true,
  className,
}: {
  code: number;
  isDay?: boolean;
  className?: string;
}) {
  const { label, icon } = describeWeather(code, isDay);
  return (
    <img
      src={ICONS[icon]}
      alt={label}
      width={320}
      height={320}
      loading="lazy"
      className={cn("icon-shadow object-contain", className)}
    />
  );
}
