# run-without-stops

Single Next.js app (frontend + API routes) with **pnpm**, strict TypeScript, Biome, Vitest, Husky, and CI.

The v1 dashboard is a Sydney-first running route planner with a 2D Mapbox dark map, live
OpenStreetMap signals/crossings/water data, place search, and direct or low-stop pedestrian routing.

## Setup

Node **≥ 20**.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)
- API example: [http://localhost:3000/api/hello](http://localhost:3000/api/hello)

The map needs `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Search still falls back to Nominatim, and routing
falls back to a public Valhalla development endpoint, when GraphHopper and Stadia keys are unset.
Public OSM endpoints are for low-volume development only. Set `TRACESTRACK_API_KEY` to use the
managed Overpass service for traffic lights, crossings, and drinking-water data.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix |
| `pnpm format` | Biome format |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm check` | typecheck + lint + test + build |
| `pnpm build` | Production build |

## Structure

- `src/app/` — UI pages
- `src/app/api/` — backend route handlers
- `src/lib/schemas/` — shared Zod schemas
- `src/lib/routing/` — GraphHopper and Valhalla adapters
- `src/lib/osm/` — cached runner-feature queries
- `src/components/dashboard/` — map dashboard components
- `src/env.ts` — validated environment variables
- `.cursor/rules/` — Cursor coding policies
- `.github/workflows/ci.yml` — CI gate

## Git hooks

Husky runs **lint-staged** (Biome) on commit.
