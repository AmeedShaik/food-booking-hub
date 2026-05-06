# Home Kitchen – Food Booking

A warm, cozy food booking app for a home kitchen where customers reserve meal slots and the host manages bookings from an admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/food-booking run dev` — run the frontend (port assigned by env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/bookings.ts` — Drizzle DB schema for bookings
- `artifacts/api-server/src/routes/bookings.ts` — Booking CRUD routes
- `artifacts/food-booking/src/pages/` — Frontend pages (Home booking form, Admin dashboard)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas (do not edit)

## Architecture decisions

- OpenAPI-first: all API contracts are defined in `lib/api-spec/openapi.yaml`, codegen produces React Query hooks and Zod validators
- `lib/api-zod/src/index.ts` exports selectively to avoid name collisions between `generated/api.ts` and `generated/types/` (both define body schema names)
- Bookings are stored with `date` as a plain text field (ISO date string) for simplicity — avoids timezone issues in queries
- Stats endpoint computes counts in-memory from a full table scan (small dataset expected)
- Admin route at `/admin` uses no auth (intended for the kitchen owner on their own device)

## Product

- Customer booking form: name, phone, email, date, time slot, guest count, meal type, special requests
- Booking confirmation screen shown after submission
- Admin dashboard: live stats (today's tables, pending, confirmed, completed, cancelled), filterable bookings table, status management (Confirm / Complete / Cancel), delete with confirmation dialog, guest search

## User preferences

- Warm, food-inspired color palette (terracotta, burgundy, cream)
- No emojis in the UI

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run codegen before updating routes or frontend
- `lib/api-zod/src/index.ts` must not use `export * from "./generated/types"` wholesale — selectively re-export to avoid duplicates with `generated/api.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
