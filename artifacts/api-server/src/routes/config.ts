import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER ?? "",
  });
});

export default router;
