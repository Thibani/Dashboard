# Dashboard — Proof of Concept

## 1. Objective

This document demonstrates that the core architectural risks of the project — the plugin-based service/widget system, the Docker-first build, the Timer, and real external API integration — are solved and working end to end, before investing further effort in breadth (more services, auth, OAuth).

## 2. Scope

The subject's hardest technical risk is not "can we build a CRUD app" — it's whether the **service/widget model stays extensible** as more services are added, and whether the **mandatory `/about.json` contract** and **Docker build** stay reliable under that growth. The POC therefore targeted exactly those risks, using two real (not mocked) services:

- `weather.city_temperature` — calls the free Open-Meteo geocoding + forecast APIs, no key required
- `rss.article_list` — parses a real RSS feed via `rss-parser`

If the plugin pattern holds for two independently-shaped services (one calling a REST API with two chained requests, one parsing XML), it holds for the rest.

## 3. What Was Validated

| Risk | How it was tested | Result |
|---|---|---|
| `/about.json` matches the subject's exact contract | `curl http://localhost:8080/about.json` against a live container | Returns `client.host`, `server.current_time`, `server.services[].widgets[].params[].type` exactly as specified, generated entirely from the plugin registry — no hand-maintained JSON |
| A new service/widget requires no change outside its own folder | Added `weather` and `rss` as self-contained plugins (`index.ts` + `widgets/*.ts`), registered with one line each in `registry.ts` | Routes, validation, and the data-fetch endpoint needed zero changes |
| Config validation is real, not decorative | `POST /widgets/preview` with a missing required field (`city`) | Correctly rejected with `400` and a structured zod error, caught by centralized error-handling middleware |
| A widget can call a real external API and return usable data | `POST /widgets/preview` for both widgets | Weather returned live temperature for Strasbourg; RSS returned real parsed articles from a live feed |
| `docker-compose build` / `docker-compose up` works as the subject mandates | Full `docker compose build && docker compose up` cycle, including a from-scratch rebuild after `down -v` | `server` container serves on port `8080` as required; all three services (`postgres`, `server`, `client`) start and pass healthchecks |
| The Timer concept holds without a custom scheduler | Frontend `useWidgetData` hook wraps TanStack Query with `refetchInterval` set from each widget instance's stored refresh rate | Confirmed polling behavior in the browser — each widget refetches independently on its own interval, no shared `setInterval` state |
| Frontend plugin symmetry | Added `Display.tsx` + `ConfigForm.tsx` per widget under `features/services/<service>/<widget>/`, resolved at runtime via Vite's `import.meta.glob` | New widget UI requires no edits to `registry.ts`, `WidgetShell.tsx`, or the add-widget dialog |

## 4. Conclusion

The plugin architecture is proven for both the backend and frontend. The remaining work (auth, OAuth-based services, DB-backed widget instances) is additive within this structure, not a redesign.