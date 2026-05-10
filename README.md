# 🍛 Food Booking Hub — Home Kitchen

A weekend food pre-order system. Customers order online, pay 50% via PhonePe, pick up on weekends.

**Live:** `https://your-vercel-app.vercel.app`  
**Admin:** `https://your-vercel-app.vercel.app/kitchen-dash`

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| State | TanStack Query |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Payments | PhonePe UPI deep link |
| Notifications | WhatsApp (wa.me) |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/food-booking-hub.git
cd food-booking-hub

# 2. Install all dependencies
npm run install:all

# 3. Set up environment
cp .env.example server/.env
# Edit server/.env with your DATABASE_URL, UPI_ID etc.

cp .env.example client/.env
# Edit client/.env with VITE_API_URL=http://localhost:3001

# 4. Set up the database
# Run server/src/db/schema.sql in your PostgreSQL

# 5. Start both servers
npm run dev
```

- Customer page: http://localhost:5173
- Admin panel: http://localhost:5173/kitchen-dash
- API: http://localhost:3001

---

## Deploy

### Backend → Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repo
3. Add a **PostgreSQL** plugin → Railway gives you `DATABASE_URL`
4. Run `schema.sql` in Railway's database shell
5. Set env vars: `WHATSAPP_NUMBER`, `UPI_ID`, `UPI_NAME`
6. Copy your Railway app URL

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set env vars:
   - `VITE_API_URL` = your Railway URL
   - `VITE_WHATSAPP_NUMBER` = e.g. `918019997768`
   - `VITE_UPI_ID` = e.g. `9030921654-5@ybl`
   - `VITE_UPI_NAME` = `AMEED HUSSAIN SHAIK`
3. Deploy

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookings` | All bookings (admin) |
| POST | `/api/bookings` | Create new booking |
| GET | `/api/bookings/stats` | Order counts by status |
| PATCH | `/api/bookings/:id/status` | Update order status |
| DELETE | `/api/bookings/:id` | Delete a booking |
| GET | `/api/config` | Public config (menu, UPI) |

---

## Menu & Pricing

- Chicken Biryani — ₹200/portion (250g)
- Mutton Biryani — ₹200/portion (250g)
- Chicken 65 — ₹200/portion (250g)

50% advance via PhonePe · Balance on pickup · Weekend orders only

---

Built by **Ameed Hussain Shaik** · WhatsApp: +91 80199 97768
