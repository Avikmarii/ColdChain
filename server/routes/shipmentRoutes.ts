import { Router, Request, Response, NextFunction } from "express";
import {
  readStorage,
  getShipmentById,
  createShipment,
  updateShipment,
  deleteShipment,
  resetStorage
} from "../data/storage";

const router = Router();

// GET /api/shipments
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const qStr = ((req.query.q as string) || "").toLowerCase().trim();
    const statusFilter = (req.query.status as string) || "ALL";
    const categoryFilter = (req.query.category as string) || "ALL";
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit as string, 10) || 50));

    let items = readStorage();

    if (qStr) {
      items = items.filter(
        (s) =>
          s.id.toLowerCase().includes(qStr) ||
          s.name.toLowerCase().includes(qStr) ||
          `${s.origin} to ${s.destination}`.toLowerCase().includes(qStr) ||
          (s.assignedDriver && s.assignedDriver.toLowerCase().includes(qStr))
      );
    }

    if (statusFilter !== "ALL") {
      items = items.filter((s) => s.status === statusFilter);
    }

    if (categoryFilter !== "ALL") {
      items = items.filter((s) => s.category === categoryFilter);
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    // Master Prompt compatibility: respond with data array and pagination metadata
    res.json({
      data: paginatedItems,
      shipments: paginatedItems,
      total,
      page,
      limit,
      provenanceBanner: "Demo simulation: illustrative results only."
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/shipments/reset - Resets datastore to initial canonical shipments
router.post("/reset", (req: Request, res: Response, next: NextFunction) => {
  try {
    const resetRecords = resetStorage();
    res.json({
      success: true,
      message: "Datastore reset to canonical initial shipments.",
      count: resetRecords.length,
      data: resetRecords
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/shipments/:id
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const shipment = getShipmentById(id);
    if (!shipment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Shipment with ID "${id}" was not found.`
        }
      });
    }

    res.json({
      data: shipment,
      shipment
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/shipments
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    if (!body || !body.id || !body.name || !body.origin || !body.destination) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Shipment ID, Name, Origin, and Destination are required."
        }
      });
    }

    const cleanId = String(body.id).trim();

    // ID Collision checking (Non-negotiable)
    if (getShipmentById(cleanId)) {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "Shipment ID already exists. Enter a unique identifier."
        }
      });
    }

    const created = createShipment({
      ...body,
      id: cleanId,
      source: "user",
      isDemoRecord: false
    });

    res.status(201).json({
      data: created,
      shipment: created,
      provenance: "User-defined (unverified)"
    });
  } catch (err: any) {
    if (err.statusCode === 409 || err.code === "CONFLICT") {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: err.message || "Shipment ID already exists. Enter a unique identifier."
        }
      });
    }
    next(err);
  }
});

// PUT /api/shipments/:id
router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const originalId = decodeURIComponent(req.params.id);
    const existing = getShipmentById(originalId);
    if (!existing) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: `Shipment with ID "${originalId}" was not found.`
        }
      });
    }

    const body = req.body;
    // Check collision if ID is being renamed
    if (body.id && body.id.trim().toLowerCase() !== originalId.toLowerCase()) {
      const targetId = body.id.trim();
      if (getShipmentById(targetId)) {
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: `Shipment ID "${targetId}" already exists. Enter a unique identifier.`
          }
        });
      }
    }

    const updated = updateShipment(originalId, body);
    res.json({
      data: updated,
      shipment: updated
    });
  } catch (err: any) {
    if (err.statusCode === 409 || err.code === "CONFLICT") {
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: err.message
        }
      });
    }
    next(err);
  }
});

// DELETE /api/shipments/:id
router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = decodeURIComponent(req.params.id);
    deleteShipment(id);
    res.json({
      success: true,
      message: `Shipment "${id}" deleted successfully.`
    });
  } catch (err: any) {
    if (err.statusCode === 404 || err.code === "NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: err.message
        }
      });
    }
    next(err);
  }
});

export default router;
