import { Router, Request, Response, NextFunction } from "express";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../db";
import { runScenarioSimulation } from "../engine";
import { getRoutesForPair } from "../data/demoRoutes";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
const SHIPMENTS_COLLECTION = "shipments";
const SCENARIOS_COLLECTION = "scenarios";
const INCIDENTS_COLLECTION = "incidents";

// GET /api/v1/shipments/:id/scenarios
router.get("/:id/scenarios", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const snap = await getDocs(collection(db, SCENARIOS_COLLECTION));
    const items: any[] = [];

    snap.forEach((d) => {
      const data = d.data();
      if (data.shipmentId === id) {
        items.push(data);
      }
    });

    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json({ data: items });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to retrieve scenarios."));
  }
});

// POST /api/v1/shipments/:id/scenarios
router.post("/:id/scenarios", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const shipmentSnap = await getDoc(doc(db, SHIPMENTS_COLLECTION, id));
    if (!shipmentSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    const shipment = shipmentSnap.data();
    const routes = getRoutesForPair(shipment.origin, shipment.destination);
    const routeId = body.routeId || "route-a";
    const selectedRoute = routes.find((r) => r.id === routeId);

    if (!selectedRoute) {
      return next(new ApiError(400, "INVALID_ROUTE", `Route "${routeId}" does not exist for this shipment corridor.`));
    }

    // Validation
    const extraDelayMin = Number(body.extraDelayMin ?? 0);
    const ambientC = Number(body.ambientC ?? 32);
    const coolingInterruptionMin = Number(body.coolingInterruptionMin ?? 0);

    if (isNaN(extraDelayMin) || extraDelayMin < 0 || extraDelayMin > 180) {
      return next(new ApiError(400, "VALIDATION_FAILED", "extraDelayMin must be between 0 and 180 minutes."));
    }
    if (isNaN(ambientC) || ambientC < 15 || ambientC > 45) {
      return next(new ApiError(400, "VALIDATION_FAILED", "ambientC must be between 15°C and 45°C."));
    }
    if (isNaN(coolingInterruptionMin) || coolingInterruptionMin < 0 || coolingInterruptionMin > 120) {
      return next(new ApiError(400, "VALIDATION_FAILED", "coolingInterruptionMin must be between 0 and 120 minutes."));
    }

    const scenarioInputs = {
      extraDelayMin,
      ambientC,
      isInterrupted: Boolean(body.isInterrupted),
      coolingInterruptionMin: Boolean(body.isInterrupted) ? coolingInterruptionMin : 0,
      insulationPreset: body.insulationPreset || shipment.container?.insulation || "Moderate"
    };

    // Run scenario engine. NOTE: Never mutates the shipment or the baseline!
    const result = runScenarioSimulation({
      shipment,
      route: selectedRoute,
      scenario: scenarioInputs
    });

    const scenarioId = `SCEN-${id}-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const scenarioRecord = {
      id: scenarioId,
      shipmentId: id,
      routeId,
      inputs: scenarioInputs,
      baseline: result.baseline,
      modified: result.modified,
      explanation: result.explanation,
      createdAt: nowIso
    };

    // Persist scenario record
    await setDoc(doc(db, SCENARIOS_COLLECTION, scenarioId), scenarioRecord);

    // If scenario caused an excursion, log simulated incident
    if (result.modified.excursions && result.modified.excursions.length > 0) {
      for (let i = 0; i < result.modified.excursions.length; i++) {
        const ex = result.modified.excursions[i];
        const incidentId = `INC-SCEN-${id}-${Date.now()}-${i}`;
        await setDoc(doc(db, INCIDENTS_COLLECTION, incidentId), {
          id: incidentId,
          shipmentId: id,
          routeId,
          scenarioId,
          severity: result.modified.riskLevel === "high" ? "High" : "Medium",
          description: `What-If Scenario incident: breach peak ${ex.peakC}°C during simulated ${scenarioInputs.extraDelayMin}m delay.`,
          peakC: ex.peakC,
          durationMin: ex.endMin - ex.startMin,
          provenance: "demo-simulated",
          createdAt: nowIso
        });
      }
    }

    res.json({
      data: scenarioRecord
    });
  } catch (err: any) {
    next(new ApiError(500, "SCENARIO_ERROR", err.message || "Failed to execute scenario simulation."));
  }
});

export default router;
