import { Router, Request, Response, NextFunction } from "express";
import { getShipmentById, updateShipment } from "../data/storage";
import { analyzeShipmentRoutes } from "../engine";

const router = Router();

// GET /api/analysis/:id or GET /api/shipments/:id/analysis
router.get(["/:id", "/:id/analysis"], (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const shipment = getShipmentById(id);
    if (!shipment) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `Shipment with ID "${id}" was not found.` }
      });
    }

    if (!shipment.analysis) {
      return res.json({
        data: null,
        message: "Not yet evaluated",
        provenanceBanner: "Demo simulation: illustrative results only."
      });
    }

    res.json({
      data: shipment.analysis,
      analysis: shipment.analysis,
      provenance: "demo-simulated",
      provenanceBanner: "Demo simulation: illustrative results only."
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/analysis/:id or POST /api/shipments/:id/analysis
router.post(["/:id", "/:id/analysis"], (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const shipment = getShipmentById(id);
    if (!shipment) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `Shipment with ID "${id}" was not found.` }
      });
    }

    // Run deterministic thermal simulation on backend
    const results = analyzeShipmentRoutes(shipment);
    const preferredRouteId = results.ranking?.preferredRouteId;
    const newStatus = preferredRouteId ? "Recommended" : "No Feasible Route";
    const nowIso = new Date().toISOString();

    const activity = Array.isArray(shipment.activity) ? [...shipment.activity] : [];
    activity.unshift({
      at: nowIso,
      text: `Thermal simulation executed: ${newStatus === "Recommended" ? "meets configured limits in this simulation" : "limits exceeded in this simulation"}`,
      provenance: "demo-simulated"
    });

    const updated = updateShipment(shipment.id, {
      status: newStatus,
      selectedRouteId: preferredRouteId || shipment.selectedRouteId,
      analysis: results,
      activity,
      updatedAt: nowIso
    });

    res.json({
      success: true,
      data: updated,
      shipment: updated,
      analysis: results,
      status: newStatus,
      provenance: "demo-simulated",
      provenanceBanner: "Demo simulation: illustrative results only.",
      notes: "Simulation parameters evaluated. Preferred route selected under current assumptions."
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "SIMULATION_ERROR",
        message: err.message || "Failed to execute server-side thermal simulation."
      }
    });
  }
});

export default router;
