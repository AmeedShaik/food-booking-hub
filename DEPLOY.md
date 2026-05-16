# Deploying to Render

This repo ships with a Render Blueprint (`render.yaml`) that provisions:

- A managed Postgres 16 database (free tier)
- A single Node.js web service that serves both the Express API (under `/api`) and the built React frontend

Both come up on one URL — no CORS, no separate frontend deploy.

---

## One-time deploy steps

1. **Sign in / sign up at Render**
   Go to <https://render.com> and authenticate with your GitHub account so it can read this repo.

2. **Create a Blueprint Instance**
   Open <https://dashboard.render.com/blueprints> and click **New Blueprint Instance**.

3. **Pick the repo**
   Select `AmeedShaik/food-booking-hub`. When asked for a branch, choose **`replit-export`** (or whichever branch this file lives on).

4. **Apply**
   Render reads `render.yaml`, shows you the database and service it will create, and asks you to confirm. Click **Apply**.

5. **Wait ~5 minutes** for the first build:
   - Postgres provisions
   - `pnpm install` runs
   - `pnpm run build` typechecks + builds frontend (vite) and API server (esbuild)
   - `pnpm --filter @workspace/db run push` creates the `bookings` and `menu_items` tables
   - `pnpm --filter @workspace/db run seed-menu` inserts 3 starter menu items
   - The web service starts and the health check `GET /api/healthz` returns 200

6. **Visit your URL.** Render gives you something like `https://food-booking-XXXX.onrender.com`. The customer site is at `/`, the kitchen admin at `/kitchen-dash`, and menu management at `/kitchen-dash/menu`.

---

## Optional: enable WhatsApp notifications

The booking confirmation can ping the kitchen owner over WhatsApp via [TextMeBot](https://textmebot.com).

In the Render dashboard, open your `food-booking` service → **Environment** tab, and set:

- `WHATSAPP_NUMBER` — the kitchen owner's number in international format, e.g. `919999999999`
- `TEXTMEBOT_API_KEY` — your TextMeBot API key

Click **Save Changes** and Render will redeploy automatically. If you skip this step, everything still works — the booking flow just won't send WhatsApp pings.

---

## Updating the deployed app

Push to the `replit-export` branch on GitHub and Render will auto-deploy. The `autoDeploy: true` setting in `render.yaml` handles it.

If a future deploy needs a schema change, the `pnpm --filter @workspace/db run push` step in the build command applies it automatically. **Drizzle's `push` is destructive on incompatible changes**, so for production-grade migrations you may want to switch to `drizzle-kit migrate` later.

---

## Free tier caveats

- The web service spins down after ~15 min of no traffic and takes ~30 sec to wake on the next request. For an always-on service, upgrade to the Starter plan ($7/mo).
- The free Postgres database is wiped after **90 days of inactivity** — back up your data periodically once you have real customers, or upgrade.

---

## Local development

Render config doesn't change the local dev workflow:

```bash
pnpm install
# Set DATABASE_URL to a local or Neon Postgres connection string
export DATABASE_URL="postgres://..."

# Apply schema
pnpm --filter @workspace/db run push
# (Optional) seed menu items
pnpm --filter @workspace/db run seed-menu

# Run API + frontend in two terminals
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/food-booking run dev
```
