// Weather Dashboard

A real-time weather dashboard that shows live weather for any city in the world, built with modern asynchronous JavaScript and a free public REST API.

// Features

- Search any city with live suggestions, or use your current location
- Live temperature, humidity, wind, pressure, visibility, UV index and air quality
- Hourly forecast for the next 24 hours and a 7-day forecast
- A cities page with live weather for major cities around the world
- Comprehensive error handling for network failures, timeouts and cities that are not found
- Fully responsive glassmorphism design with a night-sky theme

// Tech Stack

- React 19 + TypeScript — UI components with full type safety, so data errors are caught at build time
- TanStack Start — file-based routing and server-side rendering; each page (Dashboard, Forecast, Cities) is its own route file
- TanStack Query — handles all API calls with automatic caching, background refetching and retry logic
- Tailwind CSS v4 — utility-first styling with custom design tokens for the glassmorphism night theme
- Open-Meteo REST API — free weather and geocoding API
- Vite — fast dev server and build tool
- Lucide React — icon library for UI icons
- Vitest — unit tests for the weather data parsing logic
