import { Router, Request, Response, NextFunction } from "express";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { PRODUCT_CATEGORIES } from "../data/demoRoutes";

const router = Router();
const SHIPMENTS_COLLECTION = "shipments";
const ALLOWED_STATUSES = ["Draft", "Analyzed", "Recommended", "No Feasible Route"];

function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Formula injection guard (=, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      currentRow.push(currentField);
      currentField = "";
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// GET /api/v1/csv/export
router.get("/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
    const shipments: any[] = [];
    snap.forEach((d) => shipments.push(d.data()));

    shipments.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const headers = ["id", "name", "category", "route", "status", "date", "provenance"];
    const rows = shipments.map((s) => {
      const routeStr = `${s.origin} to ${s.destination}`;
      const dateStr = s.departureDateTime || s.createdAt || new Date().toISOString();
      let provenanceStr = "demo-simulated";
      if (s.source === "imported") provenanceStr = "User-imported (unverified)";
      else if (s.source === "user") provenanceStr = "user-configured";

      return [
        sanitizeCsvCell(s.id),
        sanitizeCsvCell(s.name),
        sanitizeCsvCell(s.category),
        sanitizeCsvCell(routeStr),
        sanitizeCsvCell(s.status),
        sanitizeCsvCell(dateStr),
        sanitizeCsvCell(provenanceStr)
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="coldchain-shipments-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csvContent);
  } catch (err: any) {
    next(new ApiError(500, "EXPORT_ERROR", "Failed to export shipments CSV."));
  }
});

// POST /api/v1/csv/import
router.post("/import", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let csvContent = "";
    if (typeof req.body === "string") {
      csvContent = req.body;
    } else if (req.body?.csvContent) {
      csvContent = req.body.csvContent;
    } else {
      return next(new ApiError(400, "INVALID_PAYLOAD", "Missing CSV content in request body."));
    }

    if (csvContent.length > 1024 * 1024) {
      return next(new ApiError(400, "FILE_TOO_LARGE", "CSV file size exceeds the 1 MB limit."));
    }

    const rows = parseCsvRows(csvContent);
    if (rows.length < 2) {
      return next(new ApiError(400, "EMPTY_CSV", "CSV file must contain a header row and at least one data row."));
    }

    if (rows.length - 1 > 500) {
      return next(new ApiError(400, "ROW_LIMIT_EXCEEDED", "CSV file exceeds maximum limit of 500 rows."));
    }

    const rawHeaders = rows[0].map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["id", "name", "category", "route", "status", "date"];

    for (const reqCol of requiredHeaders) {
      if (!rawHeaders.includes(reqCol)) {
        return next(
          new ApiError(
            400,
            "MISSING_COLUMN",
            `Missing required column: "${reqCol}". Headers must include: ${requiredHeaders.join(", ")}`
          )
        );
      }
    }

    const headerIndices = {
      id: rawHeaders.indexOf("id"),
      name: rawHeaders.indexOf("name"),
      category: rawHeaders.indexOf("category"),
      route: rawHeaders.indexOf("route"),
      status: rawHeaders.indexOf("status"),
      date: rawHeaders.indexOf("date")
    };

    // Get all existing IDs from Firestore
    const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
    const existingIds = new Set<string>();
    snap.forEach((d) => existingIds.add(d.id));

    const importedShipments: any[] = [];
    const skippedRows: Array<{ row: number; id: string; reason: string }> = [];
    const seenIdsInFile = new Set<string>();

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const rawId = row[headerIndices.id]?.trim() || "";
      const id = rawId.startsWith("'") ? rawId.slice(1) : rawId;
      const name = row[headerIndices.name]?.trim() || "";
      const categoryRaw = row[headerIndices.category]?.trim() || "";
      const routeRaw = row[headerIndices.route]?.trim() || "";
      const statusRaw = row[headerIndices.status]?.trim() || "";
      const dateRaw = row[headerIndices.date]?.trim() || "";

      if (!id || !name) {
        skippedRows.push({
          row: rowIndex + 1,
          id: id || "(empty)",
          reason: "Missing required Shipment ID or Name."
        });
        continue;
      }

      if (existingIds.has(id)) {
        skippedRows.push({
          row: rowIndex + 1,
          id,
          reason: "Duplicate Shipment ID already exists in the application."
        });
        continue;
      }

      if (seenIdsInFile.has(id)) {
        skippedRows.push({
          row: rowIndex + 1,
          id,
          reason: "Duplicate Shipment ID repeated within this CSV file."
        });
        continue;
      }

      const parsedDate = new Date(dateRaw);
      if (isNaN(parsedDate.getTime())) {
        skippedRows.push({
          row: rowIndex + 1,
          id,
          reason: `Invalid or unparseable departure date: "${dateRaw}".`
        });
        continue;
      }

      seenIdsInFile.add(id);

      let category = "Other";
      const matchedCat = PRODUCT_CATEGORIES.find((c) => c.toLowerCase() === categoryRaw.toLowerCase());
      if (matchedCat) category = matchedCat;

      let status = "Draft";
      const matchedStat = ALLOWED_STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase());
      if (matchedStat) status = matchedStat;

      let origin = "Bengaluru";
      let destination = "Mysuru";
      if (routeRaw.includes(" to ")) {
        const parts = routeRaw.split(" to ");
        origin = parts[0].trim();
        destination = parts[1].trim();
      } else if (routeRaw.includes("→")) {
        const parts = routeRaw.split("→");
        origin = parts[0].trim();
        destination = parts[1].trim();
      }

      const nowIso = new Date().toISOString();
      const shipmentRecord = {
        id,
        name,
        category,
        description: "Imported from external CSV report",
        origin,
        destination,
        departureDateTime: dateRaw,
        maxTransitHours: 8,
        temperatureLimits: {
          minC: 2.0,
          maxC: 8.0,
          unit: "C",
          source: "Imported specification",
          isDemoAssumption: false,
          notes: "Imported record"
        },
        container: {
          insulation: "Moderate",
          coolingSystem: "Active (Refrigerated)",
          notes: "Imported container specification"
        },
        status,
        selectedRouteId: null,
        assignedDriver: null,
        analysis: null, // Never create simulated values for imported records
        activity: [
          {
            at: nowIso,
            text: "Imported from CSV",
            provenance: "user-reported"
          }
        ],
        isDemoRecord: false,
        source: "imported",
        createdAt: nowIso,
        updatedAt: nowIso
      };

      importedShipments.push(shipmentRecord);
    }

    // Persist all imported shipments to Firestore
    for (const record of importedShipments) {
      await setDoc(doc(db, SHIPMENTS_COLLECTION, record.id), record);
    }

    res.json({
      data: {
        insertedCount: importedShipments.length,
        skippedCount: skippedRows.length,
        skippedRows
      },
      count: importedShipments.length,
      skippedRows,
      message: `Imported ${importedShipments.length} records, skipped ${skippedRows.length}.`
    });
  } catch (err: any) {
    next(new ApiError(500, "IMPORT_ERROR", "Failed to process and import CSV."));
  }
});

// DELETE /api/v1/csv/imported
router.delete("/imported", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snap = await getDocs(collection(db, SHIPMENTS_COLLECTION));
    let deletedCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.source === "imported") {
        await deleteDoc(doc(db, SHIPMENTS_COLLECTION, docSnap.id));
        deletedCount++;
      }
    }

    res.json({
      success: true,
      deletedCount,
      message: `Removed ${deletedCount} imported shipment records.`
    });
  } catch (err: any) {
    next(new ApiError(500, "DELETE_ERROR", "Failed to remove imported records."));
  }
});

export default router;
