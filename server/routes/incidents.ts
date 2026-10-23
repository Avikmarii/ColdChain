import { Router, Request, Response, NextFunction } from "express";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../db";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
const INCIDENTS_COLLECTION = "incidents";

// GET /api/v1/incidents
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipmentId = (req.query.shipmentId as string) || "";
    const severity = (req.query.severity as string) || "";
    const routeId = (req.query.routeId as string) || "";

    const snap = await getDocs(collection(db, INCIDENTS_COLLECTION));
    let incidents: any[] = [];

    snap.forEach((d) => {
      incidents.push(d.data());
    });

    if (shipmentId) {
      incidents = incidents.filter((i) => i.shipmentId === shipmentId);
    }
    if (severity) {
      incidents = incidents.filter((i) => i.severity?.toLowerCase() === severity.toLowerCase());
    }
    if (routeId) {
      incidents = incidents.filter((i) => i.routeId === routeId);
    }

    incidents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    res.json({
      data: incidents,
      total: incidents.length,
      provenance: "demo-simulated"
    });
  } catch (err: any) {
    next(new ApiError(500, "DATABASE_ERROR", "Failed to retrieve incident logs."));
  }
});

export default router;
