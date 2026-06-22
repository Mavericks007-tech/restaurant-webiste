import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDb } from "./server/db.ts";
import apiRouter from "./server/routes.ts";

async function startServer() {
  // 1. Setup SQLite tables and default seeds before Express accepts connections
  try {
    console.log("System: Checking SQLite database and seeds...");
    await initDb();
    console.log("System: SQLite database fully sync'd.");
  } catch (err) {
    console.error("System ERROR: Failed to prepare database:", err);
  }

  const app = express();
  const PORT = 3000;

  // 2. Parsers
  app.use(express.json());

  // 3. Mount Backend API router
  app.use("/api", apiRouter);

  // 4. Vite Environment Routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("System: Vite compilation middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("System: Standalone production files serving active.");
  }

  // 5. Ingress binding
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`System OK: Server and API Gateway running on port ${PORT}`);
  });
}

startServer();
