import { Router, Request, Response, NextFunction } from "express";
import { getShipmentById, updateShipment } from "../data/storage";

const router = Router();

// POST /api/driver/incident (or /api/driver/incidents)
router.post(["/incident", "/incidents"], (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      shipmentId,
      incidentType,
      label,
      delayMinutes = 0,
      tempIncreaseC = 0,
      tempDeltaC = 0,
      notes = "",
      location = "Highway Corridor",
      ambientC = 33.0,
      reporter = "In-Transit Driver"
    } = req.body;

    if (!shipmentId) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "shipmentId is required" }
      });
    }

    const shipment = getShipmentById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `Shipment "${shipmentId}" not found.` }
      });
    }

    const actualTempDelta = Number(tempDeltaC || tempIncreaseC || 0);
    const actualDelay = Number(delayMinutes || 0);
    const nowIso = new Date().toISOString();

    const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const incidentLabel =
      label ||
      (incidentType === "TRAFFIC_DELAY" || incidentType === "traffic_delay"
        ? "Heavy Traffic Delay"
        : incidentType === "REEFER_SPIKE" || incidentType === "cooling_glitch"
        ? "Cooling System Glitch / Temp Spike"
        : incidentType === "REEFER_RESTORED"
        ? "Reefer Restored"
        : "Driver Incident Report");

    const newIncident = {
      id: incidentId,
      type: incidentType || "DRIVER_REPORT",
      label: incidentLabel,
      notes: notes || "",
      timestamp: nowIso,
      delayMinutes: actualDelay,
      tempDeltaC: actualTempDelta,
      provenance: "driver-reported"
    };

    const currentIncidents = Array.isArray(shipment.incidents) ? [...shipment.incidents] : [];
    currentIncidents.unshift(newIncident);

    const updatedDelay = (shipment.transitDelayMin || 0) + actualDelay;
    const currentTemp = typeof shipment.currentTempC === "number" ? shipment.currentTempC : 4.4;
    const updatedTemp = Number(Math.max(-20, Math.min(45, currentTemp + actualTempDelta)).toFixed(1));

    const currentTelemetry = Array.isArray(shipment.telemetry) ? [...shipment.telemetry] : [];
    currentTelemetry.push({
      timestamp: nowIso,
      tempC: updatedTemp,
      location,
      ambientC: Number(ambientC) || 33.0,
      incidentId
    });

    const currentActivity = Array.isArray(shipment.activity) ? [...shipment.activity] : [];
    currentActivity.unshift({
      at: nowIso,
      text: `Driver Log: ${incidentLabel}${notes ? ` (${notes})` : ""}`,
      provenance: "driver-reported"
    });

    const updated = updateShipment(shipment.id, {
      transitDelayMin: updatedDelay,
      currentTempC: updatedTemp,
      incidents: currentIncidents,
      telemetry: currentTelemetry,
      activity: currentActivity,
      updatedAt: nowIso
    });

    res.json({
      success: true,
      incident: newIncident,
      shipment: updated,
      data: updated,
      provenanceBanner: "Demo simulation: illustrative results only."
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/driver/status
router.post("/status", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipmentId, transitStatus, progressPct, currentLocation } = req.body;
    if (!shipmentId) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "shipmentId is required" }
      });
    }

    const shipment = getShipmentById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `Shipment "${shipmentId}" not found.` }
      });
    }

    const nowIso = new Date().toISOString();
    const currentActivity = Array.isArray(shipment.activity) ? [...shipment.activity] : [];
    if (transitStatus && transitStatus !== shipment.transitStatus) {
      const statusText =
        transitStatus === "ARRIVED"
          ? "Driver arrived at receiving clinic for custody handover"
          : transitStatus === "IN_TRANSIT"
          ? "Driver confirmed en-route dispatch"
          : `Transit status updated to ${transitStatus}`;

      currentActivity.unshift({
        at: nowIso,
        text: statusText,
        provenance: "driver-reported"
      });
    }

    const updated = updateShipment(shipment.id, {
      transitStatus: transitStatus || shipment.transitStatus,
      progressPct: typeof progressPct === "number" ? progressPct : shipment.progressPct,
      activity: currentActivity,
      updatedAt: nowIso
    });

    res.json({
      success: true,
      shipment: updated,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
