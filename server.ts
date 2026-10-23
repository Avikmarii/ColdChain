import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import shipmentsRouter, { ensureSeedShipments } from "./server/routes/shipments";
import analysisRouter from "./server/routes/analysis";
import scenariosRouter from "./server/routes/scenarios";
import incidentsRouter from "./server/routes/incidents";
import csvRouter from "./server/routes/csv";
import { errorHandler } from "./server/middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: "text/csv", limit: "2mb" }));

// Health / Status endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ColdChain Intelligence Backend",
    timestamp: new Date().toISOString()
  });
});

// Mount /api/v1 routes
app.use("/api/v1/shipments", shipmentsRouter);
app.use("/api/v1/shipments", analysisRouter);
app.use("/api/v1/shipments", scenariosRouter);
app.use("/api/v1/incidents", incidentsRouter);
app.use("/api/v1/csv", csvRouter);

// API Error handling (Requirement 6: { error: { code, message, details } })
app.use("/api", errorHandler);

async function startServer() {
  try {
    // Seed Firestore with initial shipments if empty
    await ensureSeedShipments();

    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.resolve(process.cwd(), "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ColdChain Intelligence server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
