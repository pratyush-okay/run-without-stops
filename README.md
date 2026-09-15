# run-without-stops

Single Next.js app (frontend + API routes) with **pnpm**, strict TypeScript, Biome, Vitest, Husky, and CI.

## Setup

Node **≥ 20**.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)
- API example: [http://localhost:3000/api/hello](http://localhost:3000/api/hello)

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
- `src/env.ts` — validated environment variables
- `.cursor/rules/` — Cursor coding policies
- `.github/workflows/ci.yml` — CI gate

## Git hooks

Husky runs **lint-staged** (Biome) on commit.
