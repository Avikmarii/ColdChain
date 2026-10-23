import { Router, Request, Response, NextFunction } from "express";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "../db";
import { SEED_SHIPMENTS } from "../data/demoShipments";
import { validateShipmentInput } from "../middleware/validator";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
const SHIPMENTS_COLLECTION = "shipments";

// Helper to seed initial shipments if database collection is empty
export async function ensureSeedShipments() {
  try {
    const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
    if (snap.empty) {
      console.log("Seeding Firestore with initial cold-chain shipments...");
      for (const s of SEED_SHIPMENTS) {
        await setDoc(doc(db, SHIPMENTS_COLLECTION, s.id), s);
      }
      console.log("Initial seed shipments created successfully.");
    }
  } catch (err) {
    console.warn("Could not check/seed Firestore shipments:", err);
  }
}

// GET /api/v1/shipments
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const qStr = ((req.query.q as string) || "").toLowerCase().trim();
    const statusFilter = (req.query.status as string) || "ALL";
    const categoryFilter = (req.query.category as string) || "ALL";
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));

    const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
    let items: any[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data());
    });

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Apply filtering
    if (qStr) {
      items = items.filter(
        (s) =>
          s.id?.toLowerCase().includes(qStr) ||
          s.name?.toLowerCase().includes(qStr) ||
          `${s.origin} to ${s.destination}`.toLowerCase().includes(qStr)
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

    res.json({
      data: paginatedItems,
      total,
      page,
      limit
    });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to retrieve shipments from database."));
  }
});

// GET /api/v1/shipments/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const docSnap = await getDoc(doc(db, SHIPMENTS_COLLECTION, id));
    if (!docSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }
    res.json({ data: docSnap.data() });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to retrieve shipment details."));
  }
});

// POST /api/v1/shipments
router.post("/", validateShipmentInput, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    let id = body.id;

    if (!id) {
      // Generate next CC-### ID
      const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
      let maxNum = 0;
      snap.forEach((d) => {
        const match = d.id.match(/^CC-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      id = `CC-${String(maxNum + 1).padStart(3, "0")}`;
    }

    const existingSnap = await getDoc(doc(db, SHIPMENTS_COLLECTION, id));
    if (existingSnap.exists()) {
      return next(new ApiError(409, "DUPLICATE_ID", `Shipment with ID "${id}" already exists.`));
    }

    const nowIso = new Date().toISOString();
    const newShipment = {
      id,
      name: body.name.trim(),
      category: body.category || "Vaccine",
      description: body.description?.trim() || "",
      origin: body.origin,
      destination: body.destination,
      departureDateTime: body.departureDateTime || nowIso,
      maxTransitHours: Number(body.maxTransitHours) || 8,
      temperatureLimits: {
        minC: Number(body.temperatureLimits?.minC ?? 2.0),
        maxC: Number(body.temperatureLimits?.maxC ?? 8.0),
        unit: "C",
        source: body.temperatureLimits?.source || "User specification",
        isDemoAssumption: Boolean(body.temperatureLimits?.isDemoAssumption),
        notes: body.temperatureLimits?.notes || ""
      },
      container: {
        insulation: body.container?.insulation || "Moderate",
        coolingSystem: body.container?.coolingSystem || "Active (Refrigerated)",
        notes: body.container?.notes || ""
      },
      status: body.status || "Draft",
      selectedRouteId: null,
      assignedDriver: null,
      analysis: null,
      activity: [
        {
          at: nowIso,
          text: "Shipment created",
          provenance: "user-reported"
        }
      ],
      isDemoRecord: false,
      source: "user",
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(doc(db, SHIPMENTS_COLLECTION, id), newShipment);
    res.status(201).json({ data: newShipment });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to create shipment record."));
  }
});

// PUT /api/v1/shipments/:id
router.put("/:id", validateShipmentInput, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const docRef = doc(db, SHIPMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    const existing = docSnap.data();
    const nowIso = new Date().toISOString();

    // Check if thermal, container, or journey inputs changed
    const limitsChanged =
      existing.temperatureLimits?.minC !== Number(body.temperatureLimits?.minC) ||
      existing.temperatureLimits?.maxC !== Number(body.temperatureLimits?.maxC);
    const containerChanged =
      existing.container?.insulation !== body.container?.insulation ||
      existing.container?.coolingSystem !== body.container?.coolingSystem;
    const journeyChanged =
      existing.origin !== body.origin ||
      existing.destination !== body.destination;

    const isStale = limitsChanged || containerChanged || journeyChanged;

    let finalStatus = existing.status;
    let finalAnalysis = existing.analysis;
    const activity = Array.isArray(existing.activity) ? [...existing.activity] : [];

    if (isStale && existing.status !== "Draft") {
      finalStatus = "Draft";
      finalAnalysis = null;
      activity.push({
        at: nowIso,
        text: "Parameters updated; previous simulation cleared to prevent stale metrics",
        provenance: "user-reported"
      });
    } else {
      activity.push({
        at: nowIso,
        text: "Shipment parameters updated",
        provenance: "user-reported"
      });
    }

    const updatedShipment = {
      ...existing,
      name: body.name.trim(),
      category: body.category || existing.category,
      description: body.description?.trim() ?? existing.description,
      origin: body.origin,
      destination: body.destination,
      departureDateTime: body.departureDateTime || existing.departureDateTime,
      maxTransitHours: Number(body.maxTransitHours) || existing.maxTransitHours,
      temperatureLimits: {
        minC: Number(body.temperatureLimits?.minC ?? existing.temperatureLimits?.minC),
        maxC: Number(body.temperatureLimits?.maxC ?? existing.temperatureLimits?.maxC),
        unit: "C",
        source: body.temperatureLimits?.source ?? existing.temperatureLimits?.source,
        isDemoAssumption: Boolean(body.temperatureLimits?.isDemoAssumption ?? existing.temperatureLimits?.isDemoAssumption),
        notes: body.temperatureLimits?.notes ?? existing.temperatureLimits?.notes
      },
      container: {
        insulation: body.container?.insulation ?? existing.container?.insulation,
        coolingSystem: body.container?.coolingSystem ?? existing.container?.coolingSystem,
        notes: body.container?.notes ?? existing.container?.notes
      },
      status: finalStatus,
      analysis: finalAnalysis,
      activity,
      updatedAt: nowIso
    };

    await setDoc(docRef, updatedShipment);
    res.json({ data: updatedShipment, staleReset: isStale });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to update shipment record."));
  }
});

// DELETE /api/v1/shipments/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, SHIPMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    await deleteDoc(docRef);
    res.json({ success: true, message: `Shipment "${id}" deleted.` });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to delete shipment record."));
  }
});

// POST /api/v1/shipments/:id/assign-driver
router.post("/:id/assign-driver", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driverName = (req.body.driverName as string)?.trim() || "Demo Fleet Fleet-101";

    const docRef = doc(db, SHIPMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return next(new ApiError(404, "NOT_FOUND", `Shipment with ID "${id}" was not found.`));
    }

    const existing = docSnap.data();
    const nowIso = new Date().toISOString();
    const updated = {
      ...existing,
      assignedDriver: driverName,
      activity: [
        ...(existing.activity || []),
        {
          at: nowIso,
          text: `Demo driver assigned: ${driverName}`,
          provenance: "demo-simulated"
        }
      ],
      updatedAt: nowIso
    };

    await setDoc(docRef, updated);
    res.json({ data: updated });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to assign driver."));
  }
});

export default router;
