import { PRODUCT_CATEGORIES } from "../data/demoRoutes";

const ALLOWED_STATUSES = ["Draft", "Analyzed", "Recommended", "No Feasible Route"];

/**
 * Custom robust CSV tokenizer supporting quoted fields, commas, and internal newlines.
 */
function parseCsvRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \n of \r\n
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

export function parseAndValidateCsv(fileContent, existingShipmentIds = new Set()) {
  if (!fileContent || typeof fileContent !== "string") {
    return { error: "File is empty or could not be read as text." };
  }

  // File size guard (1 MB = 1,048,576 bytes)
  if (fileContent.length > 1024 * 1024) {
    return { error: "File size exceeds the 1 MB safety limit." };
  }

  const rows = parseCsvRows(fileContent);
  if (rows.length < 2) {
    return { error: "CSV file must contain a header row and at least one data row." };
  }

  // Row count limit (at most 500 rows)
  if (rows.length - 1 > 500) {
    return { error: "CSV file exceeds maximum limit of 500 rows." };
  }

  // Normalize header names
  const rawHeaders = rows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["id", "name", "category", "route", "status", "date"];

  for (const req of requiredHeaders) {
    if (!rawHeaders.includes(req)) {
      return {
        error: `Missing required column: "${req}". Header row must include: id, name, category, route, status, date.`
      };
    }
  }

  const headerIndices = {
    id: rawHeaders.indexOf("id"),
    name: rawHeaders.indexOf("name"),
    category: rawHeaders.indexOf("category"),
    route: rawHeaders.indexOf("route"),
    status: rawHeaders.indexOf("status"),
    date: rawHeaders.indexOf("date"),
    provenance: rawHeaders.indexOf("provenance")
  };

  const importedShipments = [];
  const skippedRows = [];
  const seenIdsInFile = new Set();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rawId = row[headerIndices.id]?.trim() || "";
    // Clean potential formula injection sanitization prefix (')
    const id = rawId.startsWith("'") ? rawId.slice(1) : rawId;
    const name = row[headerIndices.name]?.trim() || "";
    const categoryRaw = row[headerIndices.category]?.trim() || "";
    const routeRaw = row[headerIndices.route]?.trim() || "";
    const statusRaw = row[headerIndices.status]?.trim() || "";
    const dateRaw = row[headerIndices.date]?.trim() || "";

    // Validation 1: non-empty id and name
    if (!id || !name) {
      skippedRows.push({
        row: rowIndex + 1,
        id: id || "(empty)",
        reason: "Missing required Shipment ID or Name"
      });
      continue;
    }

    // Validation 2: check duplicate IDs
    if (existingShipmentIds.has(id)) {
      skippedRows.push({
        row: rowIndex + 1,
        id,
        reason: "Duplicate Shipment ID already exists in the application"
      });
      continue;
    }

    if (seenIdsInFile.has(id)) {
      skippedRows.push({
        row: rowIndex + 1,
        id,
        reason: "Duplicate Shipment ID repeated within this CSV file"
      });
      continue;
    }

    // Validation 3: parseable date
    const parsedDate = new Date(dateRaw);
    if (isNaN(parsedDate.getTime())) {
      skippedRows.push({
        row: rowIndex + 1,
        id,
        reason: `Invalid or unparseable departure date: "${dateRaw}"`
      });
      continue;
    }

    seenIdsInFile.add(id);

    // Normalize category
    let category = "Other";
    const matchedCategory = PRODUCT_CATEGORIES.find(
      (c) => c.toLowerCase() === categoryRaw.toLowerCase()
    );
    if (matchedCategory) category = matchedCategory;

    // Normalize status
    let status = "Draft";
    const matchedStatus = ALLOWED_STATUSES.find(
      (s) => s.toLowerCase() === statusRaw.toLowerCase()
    );
    if (matchedStatus) status = matchedStatus;

    // Parse route origin and destination
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
      analysis: null, // Strictly null: never create simulated values for imported records!
      activity: [
        {
          at: nowIso,
          text: "Imported from CSV report",
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

  return {
    importedShipments,
    skippedRows,
    error: null
  };
}
