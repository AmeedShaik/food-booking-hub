import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingStatusEnum = pgEnum("booking_status", [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull(),
  mealType: text("meal_type").notNull(),
  specialRequests: text("special_requests"),
  status: bookingStatusEnum("status").notNull().default("Pending"),
  bookedAt: timestamp("booked_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  status: true,
  bookedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
