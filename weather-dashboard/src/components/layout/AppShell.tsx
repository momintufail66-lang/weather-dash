import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CalendarDays, Globe2, History, LayoutDashboard, Menu, MapPin } from "lucide-react";
import { toast } from "sonner";
import { nameForCoordinates, type Place } from "@/lib/weather";
import { placeFromSearch, searchFromPlace } from "@/lib/place-search";
import { addRecentCity, loadRecentCities } from "@/lib/recent-cities";
import { CitySearch } from "@/components/weather/CitySearch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", hint: "Today at a glance", icon: LayoutDashboard },
  { to: "/forecast", label: "Forecast", hint: "24 hours & 7 days", icon: CalendarDays },
  { to: "/cities", label: "Cities", hint: "Weather around the world", icon: Globe2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const search = useSearch({ from: "__root__" });
  const navigate = useNavigate();
  const place = placeFromSearch(search);
  const [menuOpen, setMenuOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recent, setRecent] = useState<Place[]>([]);
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => setRecent(loadRecentCities()), []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHeaderHidden(y > 64 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectPlace = (p: Place) => {
    setRecent(addRecentCity(p));
    setMenuOpen(false);
    void navigate({ to: ".", search: searchFromPlace(p) });
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser can't share your location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = await nameForCoordinates(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        selectPlace(p);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location access was blocked. Search for your city instead."
            : "We couldn't find your location. Search for your city instead.",
        );
      },
      { timeout: 10_000 },
    );
  };

  return (
    <div className="relative min-h-screen">
      <div className="starfield pointer-events-none fixed inset-0" aria-hidden />

      <header
        className={cn(
          "app-bar sticky top-0 z-40 transition-transform duration-300",
          headerHidden && "-translate-y-full",
        )}
      >
        <div className="mx-auto grid max-w-[96rem] grid-cols-1 items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                aria-label="Open menu"
                className="glass grid size-11 shrink-0 place-items-center rounded-2xl transition-transform hover:scale-105"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="side-drawer flex w-[86vw] max-w-xs flex-col gap-0 p-0 text-foreground"
              >
                <div className="flex items-center gap-3 px-6 pb-6 pt-7">
                  <span className="pill-active grid size-10 shrink-0 place-items-center rounded-2xl border font-display text-lg font-semibold">
                    W
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate font-display text-lg font-medium text-foreground">
                      Weather Dashboard
                    </SheetTitle>
                    <SheetDescription className="truncate text-xs text-muted-foreground">
                      Showing {place.name}
                    </SheetDescription>
                  </div>
                </div>

                <nav className="flex flex-col gap-1.5 px-3" aria-label="Main">
                  {NAV.map(({ to, label, hint, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      search={(prev) => prev}
                      onClick={() => setMenuOpen(false)}
                      activeOptions={{ exact: true, includeSearch: false }}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition-colors hover:bg-glass data-[status=active]:pill-active"
                    >
                      <span className="glass grid size-10 shrink-0 place-items-center rounded-xl">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="block truncate text-xs text-muted-foreground group-data-[status=active]:text-foreground/80">
                          {hint}
                        </span>
                      </span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-8 px-6">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <History className="size-3.5" /> Recent cities
                  </p>
                  {recent.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Cities you search will show up here.
                    </p>
                  ) : (
                    <ul className="-mx-3 flex flex-col">
                      {recent.map((p) => (
                        <li key={`${p.latitude},${p.longitude}`}>
                          <button
                            onClick={() => selectPlace(p)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-glass"
                          >
                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{p.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {[p.admin1, p.country].filter(Boolean).join(", ") || "Saved place"}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="mt-auto px-6 pb-6 pt-8 text-xs text-muted-foreground">
                  Weather data by Open-Meteo
                </p>
              </SheetContent>
            </Sheet>

            <Link to="/" search={(prev) => prev} className="flex min-w-0 items-center gap-3">
              <span className="pill-active hidden size-10 shrink-0 place-items-center rounded-2xl border font-display text-lg font-semibold sm:grid">
                W
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-medium leading-tight sm:text-xl">
                  Weather Dashboard
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Live weather, anywhere
                </span>
              </span>
            </Link>
          </div>

          <nav
            className="hidden items-center justify-center gap-1 rounded-full border border-glass-border bg-glass/40 p-1 lg:flex"
            aria-label="Pages"
          >
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                search={(prev) => prev}
                activeOptions={{ exact: true, includeSearch: false }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  "data-[status=active]:bg-glass data-[status=active]:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="min-w-0 md:justify-self-end">
            <CitySearch onSelect={selectPlace} onLocate={locate} locating={locating} />
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[96rem] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
