import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { handleLogin, handleLogout, handleSetup, handleSetupStatus } from "../auth/routes";
import { listMenuItems, listStorefrontOffers } from "../db";
import { createContext } from "./context";
import { appRouter } from "../routers";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function allowedOrigins(): Set<string> {
  return new Set([ENV.storefrontOrigin, process.env.STOREFRONT_ORIGIN].filter(Boolean) as string[]);
}

function applyFeedCors(req: express.Request, res: express.Response) {
  const origin = req.header("origin");
  if (origin && allowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
}

function clientIp(req: express.Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? "").split(",")[0];
  return (first || req.socket?.remoteAddress || "").trim() || null;
}

function sendAuthResult(res: express.Response, result: { status: number; headers: Record<string, string>; body: unknown }) {
  for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
  res.status(result.status).json(result.body);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Local credential auth (replaced Manus OAuth in the Vercel + Neon migration).
  app.get("/api/auth/setup-status", async (_req, res) => {
    sendAuthResult(res, await handleSetupStatus());
  });
  app.post("/api/auth/setup", async (req, res) => {
    sendAuthResult(res, await handleSetup({
      body: req.body, ip: clientIp(req), host: req.hostname, proto: req.protocol,
    }));
  });
  app.post("/api/auth/login", async (req, res) => {
    sendAuthResult(res, await handleLogin({
      body: req.body, ip: clientIp(req), host: req.hostname, proto: req.protocol,
    }));
  });
  app.post("/api/auth/logout", async (req, res) => {
    sendAuthResult(res, await handleLogout({ body: null, host: req.hostname, proto: req.protocol }));
  });

  app.get("/api/storefront/availability", async (req, res) => {
    applyFeedCors(req, res);
    try {
      const items = await listMenuItems();
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({
        generatedAt: new Date().toISOString(),
        items: items.map(item => ({ catalogId: item.catalogId, isAvailable: item.isAvailable && !item.isOutOfStock })),
      });
    } catch (error) {
      console.error("[storefront availability]", error);
      res.status(503).json({ error: "Availability data is temporarily unavailable" });
    }
  });
  app.get("/api/storefront/offers", async (req, res) => {
    applyFeedCors(req, res);
    try {
      const offers = await listStorefrontOffers();
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({ generatedAt: new Date().toISOString(), offers });
    } catch (error) {
      console.error("[storefront offers]", error);
      res.status(503).json({ error: "Offer data is temporarily unavailable" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
