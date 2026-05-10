import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bookingsRouter from "./routes/bookings";
import configRouter from "./routes/config";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/bookings", bookingsRouter);
app.use("/api/config", configRouter);

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
