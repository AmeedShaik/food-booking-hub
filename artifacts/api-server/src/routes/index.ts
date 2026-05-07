import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import configRouter from "./config";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(configRouter);

export default router;
