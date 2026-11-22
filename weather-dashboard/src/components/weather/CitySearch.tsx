import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { searchCities, WeatherError, type Place } from "@/lib/weather";
import { cn } from "@/lib/utils";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CitySearch({
  onSelect,
  onLocate,
  locating,
}: {
  onSelect: (place: Place) => void;
  onLocate: () => void;
  locating: boolean;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim());

  const suggestions = useQuery({
    queryKey: ["city-search", debounced.toLowerCase()],
    queryFn: ({ signal }) => searchCities(debounced, { signal }),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => setHighlight(0), [debounced]);

  const results = suggestions.data ?? [];
  const pick = (place: Place) => {
    onSelect(place);
    setTerm("");
    setOpen(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[highlight]) pick(results[highlight]);
    else setOpen(true);
  };

  const showPanel = open && term.trim().length >= 2;
  const pending = term.trim() !== debounced || suggestions.isFetching;
  const error = suggestions.error as WeatherError | null;

  return (
    <div ref={wrapRef} className="relative flex w-full items-center gap-2 md:w-auto">
      <form onSubmit={onSubmit} className="relative min-w-0 flex-1 md:w-72 xl:w-80" role="search">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search for a city"
          aria-label="Search for a city"
          className="glass h-12 w-full rounded-full pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        {showPanel && (
          <div className="glass-strong absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-3xl p-2">
            {pending && results.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </p>
            ) : error ? (
              <p className="px-4 py-3 text-sm text-destructive">{error.message}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                No city called “{term.trim()}” found. Check the spelling and try again.
              </p>
            ) : (
              <ul role="listbox">
                {results.map((place, i) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlight}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(place)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors",
                        i === highlight && "bg-accent",
                      )}
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{place.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[place.admin1, place.country].filter(Boolean).join(", ")}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        aria-label="Use my location"
        title="Use my location"
        className="glass grid size-12 shrink-0 place-items-center rounded-full text-foreground transition-transform hover:scale-105 disabled:opacity-60"
      >
        {locating ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
      </button>
    </div>
  );
}
