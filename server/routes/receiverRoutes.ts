import { Router, Request, Response, NextFunction } from "express";
import { getShipmentById, updateShipment } from "../data/storage";

const router = Router();

// POST /api/receiver/decision (or /api/receiver/inspection)
router.post(["/decision", "/inspection"], (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      shipmentId,
      disposition,
      inspectorName = "Receiving Pharmacist / QA",
      notes = "",
      criteria = {},
      timestamp
    } = req.body;

    if (!shipmentId || !disposition) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "shipmentId and disposition are required." }
      });
    }

    const cleanDisposition = String(disposition).toUpperCase();
    if (!["ACCEPT", "QUARANTINE", "REJECT"].includes(cleanDisposition)) {
      return res.status(400).json({
        error: {
          code: "INVALID_DISPOSITION",
          message: "Disposition must be one of ACCEPT, QUARANTINE, or REJECT."
        }
      });
    }

    const shipment = getShipmentById(shipmentId);
    if (!shipment) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: `Shipment "${shipmentId}" not found.` }
      });
    }

    const nowIso = timestamp || new Date().toISOString();
    const mappedStatus =
      cleanDisposition === "ACCEPT"
        ? "Accepted"
        : cleanDisposition === "QUARANTINE"
        ? "Quarantined"
        : "Rejected";

    const currentActivity = Array.isArray(shipment.activity) ? [...shipment.activity] : [];
    currentActivity.unshift({
      at: nowIso,
      text: `Receiving Clinic Disposition: Batch marked [${cleanDisposition}] by Inspector ${inspectorName}${notes ? ` - ${notes}` : ""}`,
      provenance: "receiver-verified"
    });

    const dispositionRecord = {
      status: cleanDisposition,
      inspectorName,
      notes,
      criteria,
      inspectedAt: nowIso
    };

    const updated = updateShipment(shipment.id, {
      status: mappedStatus,
      transitStatus: "ARRIVED",
      progressPct: 100,
      disposition: dispositionRecord,
      activity: currentActivity,
      updatedAt: nowIso
    });

    res.json({
      success: true,
      decision: dispositionRecord,
      shipment: updated,
      data: updated,
      provenanceBanner: "Demo simulation: illustrative results only.",
      complianceNote: "meets configured limits in this simulation"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
