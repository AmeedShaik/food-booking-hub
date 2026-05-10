import { Router } from "express";

const router = Router();

// GET /api/config — public config for the frontend
router.get("/", (_req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER || "",
    upiId: process.env.UPI_ID || "",
    upiName: process.env.UPI_NAME || "",
    pricePerPortion: 200,
    menuItems: ["Chicken Biryani", "Mutton Biryani", "Chicken 65"],
  });
});

export default router;
