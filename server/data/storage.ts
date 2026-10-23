import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const STORAGE_FILE = path.join(DATA_DIR, "storage.json");
const INITIAL_FILE = path.join(DATA_DIR, "initialShipments.json");

export interface ShipmentRecord {
  id: string;
  name: string;
  category: string;
  description?: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  maxTransitHours: number;
  temperatureLimits: {
    minC: number;
    maxC: number;
    unit?: string;
    source?: string;
    isDemoAssumption?: boolean;
  };
  container: {
    insulation: string;
    coolingSystem: string;
    notes?: string;
  };
  status: string;
  transitStatus?: string;
  selectedRouteId?: string | null;
  assignedDriver?: string | null;
  currentTempC?: number;
  transitDelayMin?: number;
  progressPct?: number;
  telemetry?: Array<{
    timestamp: string;
    tempC: number;
    location?: string;
    ambientC?: number;
    incidentId?: string;
  }>;
  incidents?: Array<{
    id: string;
    type: string;
    label: string;
    notes?: string;
    timestamp: string;
    delayMinutes?: number;
    tempDeltaC?: number;
    provenance?: string;
  }>;
  disposition?: {
    status: string;
    inspectorName?: string;
    notes?: string;
    criteria?: Record<string, boolean>;
    inspectedAt: string;
  } | null;
  analysis?: any;
  activity?: Array<{
    at: string;
    text: string;
    provenance?: string;
  }>;
  isDemoRecord?: boolean;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

function loadInitialShipments(): ShipmentRecord[] {
  try {
    if (fs.existsSync(INITIAL_FILE)) {
      const content = fs.readFileSync(INITIAL_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read initialShipments.json:", err);
  }
  return [];
}

/**
 * Ensures storage.json exists and contains at least initial data.
 */
export function ensureStorageInitialized(): ShipmentRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8").trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }

    const initial = loadInitialShipments();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  } catch (err) {
    console.error("Error initializing storage.json:", err);
    return loadInitialShipments();
  }
}

/**
 * Read all shipments from storage.json
 */
export function readStorage(): ShipmentRecord[] {
  return ensureStorageInitialized();
}

/**
 * Write all shipments to storage.json atomically
 */
export function writeStorage(shipments: ShipmentRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STORAGE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(shipments, null, 2), "utf-8");
    fs.renameSync(tempFile, STORAGE_FILE);
  } catch (err) {
    console.error("Failed to write storage.json:", err);
    throw err;
  }
}

/**
 * Reset storage.json back to initial shipments
 */
export function resetStorage(): ShipmentRecord[] {
  const initial = loadInitialShipments();
  writeStorage(initial);
  return initial;
}

/**
 * Find shipment by ID (case-insensitive fallback)
 */
export function getShipmentById(id: string): ShipmentRecord | undefined {
  const shipments = readStorage();
  const cleanId = id.trim();
  return (
    shipments.find((s) => s.id === cleanId) ||
    shipments.find((s) => s.id.toLowerCase() === cleanId.toLowerCase())
  );
}

/**
 * Check if shipment ID exists
 */
export function shipmentExists(id: string): boolean {
  return Boolean(getShipmentById(id));
}

/**
 * Create a new shipment with collision check
 */
export function createShipment(record: ShipmentRecord): ShipmentRecord {
  const shipments = readStorage();
  const cleanId = record.id.trim();

  const collision = shipments.some(
    (s) => s.id.toLowerCase() === cleanId.toLowerCase()
  );
  if (collision) {
    const error: any = new Error(
      `Shipment ID "${cleanId}" already exists. Enter a unique identifier.`
    );
    error.statusCode = 409;
    error.code = "CONFLICT";
    throw error;
  }

  const now = new Date().toISOString();
  const newRecord: ShipmentRecord = {
    ...record,
    id: cleanId,
    createdAt: record.createdAt || now,
    updatedAt: now,
    source: record.source || "user",
    isDemoRecord: typeof record.isDemoRecord === "boolean" ? record.isDemoRecord : false,
    transitStatus: record.transitStatus || "SCHEDULED",
    progressPct: typeof record.progressPct === "number" ? record.progressPct : 0,
    currentTempC: typeof record.currentTempC === "number" ? record.currentTempC : 4.0,
    transitDelayMin: typeof record.transitDelayMin === "number" ? record.transitDelayMin : 0,
    incidents: Array.isArray(record.incidents) ? record.incidents : [],
    telemetry: Array.isArray(record.telemetry) ? record.telemetry : [],
    activity: Array.isArray(record.activity)
      ? record.activity
      : [{ at: now, text: "Shipment registered in system", provenance: "user-reported" }]
  };

  shipments.unshift(newRecord);
  writeStorage(shipments);
  return newRecord;
}

/**
 * Update existing shipment
 */
export function updateShipment(
  id: string,
  updates: Partial<ShipmentRecord>
): ShipmentRecord {
  const shipments = readStorage();
  const index = shipments.findIndex(
    (s) => s.id.toLowerCase() === id.trim().toLowerCase()
  );
  if (index === -1) {
    const error: any = new Error(`Shipment with ID "${id}" was not found.`);
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  // If changing ID, check uniqueness
  if (updates.id && updates.id.trim().toLowerCase() !== id.trim().toLowerCase()) {
    const targetId = updates.id.trim();
    if (shipments.some((s) => s.id.toLowerCase() === targetId.toLowerCase())) {
      const error: any = new Error(
        `Shipment ID "${targetId}" already exists. Enter a unique identifier.`
      );
      error.statusCode = 409;
      error.code = "CONFLICT";
      throw error;
    }
  }

  const now = new Date().toISOString();
  const existing = shipments[index];
  const updated: ShipmentRecord = {
    ...existing,
    ...updates,
    id: updates.id ? updates.id.trim() : existing.id,
    updatedAt: now
  };

  shipments[index] = updated;
  writeStorage(shipments);
  return updated;
}

/**
 * Delete a shipment
 */
export function deleteShipment(id: string): boolean {
  const shipments = readStorage();
  const initialLength = shipments.length;
  const filtered = shipments.filter(
    (s) => s.id.toLowerCase() !== id.trim().toLowerCase()
  );
  if (filtered.length === initialLength) {
    const error: any = new Error(`Shipment with ID "${id}" was not found.`);
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  writeStorage(filtered);
  return true;
}
