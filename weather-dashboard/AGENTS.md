<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Weather data is fetched in the browser from Open-Meteo (no API key) through `src/lib/weather.ts`, which owns all fetch/timeout/error mapping (`WeatherError` kinds); UI components only consume its typed results so error handling stays in one place.
- The selected city lives in URL search params validated once on the root route (`src/lib/place-search.ts`), so every page (Dashboard, Forecast, Cities) shares it and nav links preserve it with `search={(prev) => prev}`.
- The shared header, side hamburger menu (Sheet) and footer live in `src/components/layout/AppShell.tsx`, mounted around `<Outlet />` in `__root.tsx`, so pages render content only.
- App images (weather icons, house) are real files in `src/assets/` imported directly, not CDN pointers, so the downloaded project shows them when run locally outside Lovable.
