import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import configRouter from "./config";
import menuItemsRouter from "./menuItems";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(configRouter);
router.use(menuItemsRouter);

export default router;
