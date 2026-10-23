import { Router, Request, Response, NextFunction } from "express";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../db";
import { analyzeShipmentRoutes } from "../engine";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
const SHIPMENTS_COLLECTION = "shipments";
const ANALYSES_COLLECTION = "analyses";
const INCIDENTS_COLLECTION = "incidents";

function computeInputHash(shipment: any) {
  return [
    shipment.origin,
    shipment.destination,
    shipment.temperatureLimits?.minC,
    shipment.temperatureLimits?.maxC,
    shipment.container?.insulation,
    shipment.container?.coolingSystem,
    shipment.maxTransitHours
  ].join("|");
}

// GET /api/v1/shipments/:id/analysis
router.get("/:id/analysis", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shipmentSnap = await getDoc(doc(db, SHIPMENTS_COLLECTION, id));
    if (!shipmentSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    const shipment = shipmentSnap.data();
    if (!shipment.analysis) {
      return res.json({ data: null, message: "No analysis has been run yet for this shipment." });
    }

    res.json({ data: shipment.analysis });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to retrieve analysis."));
  }
});

// POST /api/v1/shipments/:id/analysis
router.post("/:id/analysis", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const shipmentRef = doc(db, SHIPMENTS_COLLECTION, id);
    const shipmentSnap = await getDoc(shipmentRef);

    if (!shipmentSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    const shipment = shipmentSnap.data();
    const inputHash = computeInputHash(shipment);

    // Requirement: Running the same inputs twice returns the stored result instead of duplicating it
    const analysisDocId = `${id}_${Buffer.from(inputHash).toString("hex").slice(0, 16)}`;
    const analysisRef = doc(db, ANALYSES_COLLECTION, analysisDocId);
    const existingAnalysisSnap = await getDoc(analysisRef);

    if (existingAnalysisSnap.exists() && shipment.analysis) {
      return res.json({
        data: shipment,
        analysis: existingAnalysisSnap.data().results,
        cached: true,
        message: "Returned stored simulation result for identical inputs."
      });
    }

    // Run the engine simulation on the server
    const results: any = analyzeShipmentRoutes(shipment);
    const newStatus = results.ranking?.preferredRouteId ? "Recommended" : "No Feasible Route";
    const nowIso = new Date().toISOString();

    // Store analysis in analyses collection
    await setDoc(analysisRef, {
      shipmentId: id,
      inputHash,
      results,
      createdAt: nowIso
    });

    // Check for simulated excursions and log them in incidents collection
    for (const routeKey of Object.keys(results)) {
      if (routeKey.startsWith("route-")) {
        const routeRes = results[routeKey];
        if (routeRes.excursions && routeRes.excursions.length > 0) {
          for (let i = 0; i < routeRes.excursions.length; i++) {
            const ex = routeRes.excursions[i];
            const incidentId = `INC-${id}-${routeKey}-${Date.now()}-${i}`;
            await setDoc(doc(db, INCIDENTS_COLLECTION, incidentId), {
              id: incidentId,
              shipmentId: id,
              routeId: routeKey,
              severity: routeRes.riskLevel === "high" ? "High" : "Medium",
              description: `Simulated temperature breach reaching peak of ${ex.peakC}°C between minute ${ex.startMin} and ${ex.endMin}.`,
              peakC: ex.peakC,
              durationMin: ex.endMin - ex.startMin,
              provenance: "demo-simulated",
              createdAt: nowIso
            });
          }
        }
      }
    }

    // Update shipment with new analysis, status, and activity
    const updatedShipment = {
      ...shipment,
      status: newStatus,
      selectedRouteId: results.ranking.preferredRouteId || shipment.selectedRouteId,
      analysis: results,
      activity: [
        ...(shipment.activity || []),
        {
          at: nowIso,
          text: `Server simulation executed: ${newStatus}`,
          provenance: "demo-simulated"
        }
      ],
      updatedAt: nowIso
    };

    await setDoc(shipmentRef, updatedShipment);

    res.json({
      data: updatedShipment,
      analysis: results,
      cached: false,
      status: newStatus
    });
  } catch (err: any) {
    next(new ApiError(500, "SIMULATION_ERROR", err.message || "Failed to execute server route simulation."));
  }
});

export default router;
