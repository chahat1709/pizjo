import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { listMenuItems, listStorefrontOffers } from "../db";
import { createContext } from "./context";
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/storefront/availability", async (req, res) => {
    const allowedOrigins = new Set(["https://pizjo.vercel.app", process.env.STOREFRONT_ORIGIN].filter(Boolean));
    const origin = req.header("origin");
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
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
    const allowedOrigins = new Set(["https://pizjo.vercel.app", process.env.STOREFRONT_ORIGIN].filter(Boolean));
    const origin = req.header("origin");
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
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
