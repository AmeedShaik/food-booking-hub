import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production, serve the built frontend from the same origin as the API.
// This avoids any CORS / cross-origin auth concerns on Render.
if (process.env.NODE_ENV === "production") {
  // Compiled artifact lives at <repo>/artifacts/api-server/dist/index.mjs.
  // Frontend bundle lives at <repo>/artifacts/food-booking/dist/public/.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const staticDirEnv = process.env.STATIC_DIR;
  const staticDir = staticDirEnv
    ? path.resolve(staticDirEnv)
    : path.resolve(here, "../..", "food-booking", "dist", "public");

  if (existsSync(staticDir)) {
    logger.info({ staticDir }, "Serving static frontend");
    app.use(express.static(staticDir));

    // SPA fallback: any non-API GET that didn't match a static file should
    // return index.html so client-side routing (wouter) handles it.
    app.get(/^(?!\/api(\/|$)).*/, (_req: Request, res: Response, next: NextFunction) => {
      const indexHtml = path.join(staticDir, "index.html");
      if (!existsSync(indexHtml)) {
        next();
        return;
      }
      res.sendFile(indexHtml);
    });
  } else {
    logger.warn(
      { staticDir },
      "STATIC_DIR not found, frontend will not be served by the API server",
    );
  }
}

export default app;
