import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/bookings — all bookings (admin)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM bookings ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/stats — summary counts
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                              AS total,
        COUNT(*) FILTER (WHERE status = 'pending')           AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')         AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed')         AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')         AS cancelled,
        COUNT(*) FILTER (WHERE date = CURRENT_DATE)          AS today
      FROM bookings
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/bookings — create new booking
router.post("/", async (req: Request, res: Response) => {
  const { name, phone, email, date, time, guests, mealType, specialRequests } = req.body;
  if (!name || !phone || !email || !date || !time || !guests || !mealType) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO bookings (name, phone, email, date, time, guests, meal_type, special_requests)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, phone, email, date, time, guests, mealType, specialRequests || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

// PATCH /api/bookings/:id/status — update status
router.patch("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ["pending", "confirmed", "completed", "cancelled"];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Booking not found" });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update booking" });
  }
});

// DELETE /api/bookings/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM bookings WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
