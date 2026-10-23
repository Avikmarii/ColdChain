import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { ensureStorageInitialized } from "./server/data/storage";
import shipmentRoutes from "./server/routes/shipmentRoutes";
import driverRoutes from "./server/routes/driverRoutes";
import receiverRoutes from "./server/routes/receiverRoutes";
import analysisRoutes from "./server/routes/analysisRoutes";
import scenariosRouter from "./server/routes/scenarios";
import incidentsRouter from "./server/routes/incidents";
import csvRouter from "./server/routes/csv";
import { errorHandler } from "./server/middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.text({ type: "text/csv", limit: "2mb" }));

// Health / Status endpoint (Strict Master Prompt requirement)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ColdChain Intelligence Backend",
    timestamp: new Date().toISOString()
  });
});

// Primary REST API endpoints
app.use("/api/shipments", shipmentRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/receiver", receiverRoutes);
app.use("/api/analysis", analysisRoutes);

// Dual-mount /api/v1 aliases for backward compatibility
app.use("/api/v1/shipments", shipmentRoutes);
app.use("/api/v1/shipments", analysisRoutes);
app.use("/api/v1/shipments", scenariosRouter);
app.use("/api/v1/driver", driverRoutes);
app.use("/api/v1/receiver", receiverRoutes);
app.use("/api/v1/incidents", incidentsRouter);
app.use("/api/v1/csv", csvRouter);

// Global API error handler
app.use("/api", errorHandler);

async function startServer() {
  try {
    // Initialize persistent storage.json with initial shipments (CC-001 through CC-004)
    ensureStorageInitialized();

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
