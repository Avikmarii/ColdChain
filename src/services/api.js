/**
 * Unified Frontend API Service
 * Routes all data access, driver telemetry, receiver verification, and simulations through /api endpoints.
 * Handles network failures with explicit 'BACKEND_UNAVAILABLE' diagnostics.
 */

export class ApiServiceError extends Error {
  constructor(message, code = "API_ERROR", details = null, isBackendUnavailable = false) {
    super(message);
    this.name = "ApiServiceError";
    this.code = code;
    this.details = details;
    this.isBackendUnavailable = isBackendUnavailable;
  }
}

async function request(endpoint, options = {}) {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `/api${clean}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string" && !options.body.startsWith("id,")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: { message: `HTTP ${res.status}: ${res.statusText}`, code: "HTTP_ERROR" } };
      }

      const err = errorData.error || errorData;
      throw new ApiServiceError(
        err.message || `Request failed with status ${res.status}`,
        err.code || (res.status === 409 ? "CONFLICT" : "REQUEST_FAILED"),
        err.details
      );
    }

    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    if (err instanceof ApiServiceError) {
      throw err;
    }
    console.error("Backend request failed:", err);
    throw new ApiServiceError(
      "Unable to reach ColdChain Intelligence server. Using offline state.",
      "BACKEND_UNAVAILABLE",
      null,
      true
    );
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch("/api/health");
      return res.ok;
    } catch {
      return false;
    }
  },

  // Shipments
  getShipments: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status && params.status !== "ALL") query.set("status", params.status);
    if (params.category && params.category !== "ALL") query.set("category", params.category);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const result = await request(`/shipments${qs ? `?${qs}` : ""}`);
    return result.data || result.shipments || result;
  },

  getShipment: async (id) => {
    const result = await request(`/shipments/${encodeURIComponent(id)}`);
    return result.data || result.shipment || result;
  },

  createShipment: async (shipmentData) => {
    return await request("/shipments", {
      method: "POST",
      body: JSON.stringify(shipmentData)
    });
  },

  updateShipment: async (id, shipmentData) => {
    return await request(`/shipments/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(shipmentData)
    });
  },

  deleteShipment: async (id) => {
    return await request(`/shipments/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  },

  resetDemoData: async () => {
    return await request("/shipments/reset", {
      method: "POST"
    });
  },

  assignDriver: async (id, driverName) => {
    return await request(`/shipments/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ assignedDriver: driverName })
    });
  },

  // Driver Persona Endpoints
  reportIncident: async (payload) => {
    return await request("/driver/incident", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateDriverStatus: async (payload) => {
    return await request("/driver/status", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Receiver Persona Endpoints
  recordReceiverDecision: async (payload) => {
    return await request("/receiver/decision", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Analysis
  getAnalysis: async (shipmentId) => {
    return await request(`/analysis/${encodeURIComponent(shipmentId)}`);
  },

  runAnalysis: async (shipmentId) => {
    return await request(`/analysis/${encodeURIComponent(shipmentId)}`, {
      method: "POST"
    });
  },

  // Scenarios
  listScenarios: async (shipmentId) => {
    return await request(`/v1/shipments/${encodeURIComponent(shipmentId)}/scenarios`);
  },

  runScenario: async (shipmentId, scenarioInputs) => {
    return await request(`/v1/shipments/${encodeURIComponent(shipmentId)}/scenarios`, {
      method: "POST",
      body: JSON.stringify(scenarioInputs)
    });
  },

  // Incidents
  listIncidents: async (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.shipmentId) query.set("shipmentId", filters.shipmentId);
    if (filters.severity) query.set("severity", filters.severity);
    if (filters.routeId) query.set("routeId", filters.routeId);

    const qs = query.toString();
    return await request(`/v1/incidents${qs ? `?${qs}` : ""}`);
  },

  // CSV
  exportCsvUrl: () => "/api/v1/csv/export",

  exportCsv: async () => {
    const res = await fetch("/api/v1/csv/export");
    if (!res.ok) {
      throw new ApiServiceError("Failed to export CSV from server", "EXPORT_FAILED");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `coldchain-shipments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importCsv: async (csvContent) => {
    return await request("/v1/csv/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csvContent
    });
  },

  deleteImportedRecords: async () => {
    return await request("/v1/csv/imported", {
      method: "DELETE"
    });
  }
};

export const apiClient = api;
export default api;
