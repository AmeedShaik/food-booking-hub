import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
  GetBookingParams,
  DeleteBookingParams,
  ListBookingsQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function sendWhatsAppNotification(booking: typeof bookingsTable.$inferSelect) {
  const phone = process.env.WHATSAPP_NUMBER;
  const apiKey = process.env.TEXTMEBOT_API_KEY;

  if (!phone || !apiKey) return;

  const message = [
    "New Booking Received!",
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Date: ${booking.date} | ${booking.time}`,
    `Guests: ${booking.guests}`,
    `Meal: ${booking.mealType}`,
    booking.specialRequests ? `Notes: ${booking.specialRequests}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(message)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      logger.warn({ status: res.status }, "TextMeBot notification failed");
    } else {
      logger.info({ bookingId: booking.id }, "WhatsApp notification sent");
    }
  } catch (err) {
    logger.warn({ err }, "WhatsApp notification error");
  }
}

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    email: b.email,
    date: b.date,
    time: b.time,
    guests: b.guests,
    mealType: b.mealType,
    specialRequests: b.specialRequests ?? null,
    status: b.status,
    bookedAt: b.bookedAt.toISOString(),
  };
}

router.get("/bookings", async (req, res) => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.bookedAt));

  const filtered = query.data.status
    ? bookings.filter((b) => b.status === query.data.status)
    : bookings;

  res.json(filtered.map(formatBooking));
});

router.post("/bookings", async (req, res) => {
  const body = CreateBookingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid booking data" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      name: body.data.name,
      phone: body.data.phone,
      email: body.data.email,
      date: typeof body.data.date === "string" ? body.data.date : (body.data.date as Date).toISOString().split("T")[0],
      time: body.data.time,
      guests: body.data.guests,
      mealType: body.data.mealType,
      specialRequests: body.data.specialRequests ?? null,
    })
    .returning();

  res.status(201).json(formatBooking(booking));

  // Fire-and-forget — don't await so the response isn't delayed
  sendWhatsAppNotification(booking).catch(() => {});
});

router.get("/bookings/stats", async (_req, res) => {
  const bookings = await db.select().from(bookingsTable);
  const today = new Date().toISOString().split("T")[0];

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "Pending").length,
    confirmed: bookings.filter((b) => b.status === "Confirmed").length,
    cancelled: bookings.filter((b) => b.status === "Cancelled").length,
    completed: bookings.filter((b) => b.status === "Completed").length,
    todayCount: bookings.filter((b) => b.date === today).length,
  };

  res.json(stats);
});

router.get("/bookings/:id", async (req, res) => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(formatBooking(booking));
});

router.delete("/bookings/:id", async (req, res) => {
  const params = DeleteBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.status(204).send();
});

router.patch("/bookings/:id/status", async (req, res) => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  const body = UpdateBookingStatusBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid data" });
    return;
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: body.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(formatBooking(updated));
});

export default router;
