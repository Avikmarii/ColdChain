/**
 * ColdChain Intelligence REST API Client
 * Connects React UI and Persona Cockpits directly to the Express backend.
 * Provides clear error diagnostic classes and honest provenance tracking.
 */

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details: any;
  isBackendUnavailable: boolean;

  constructor(
    message: string,
    code: string = "API_ERROR",
    statusCode: number = 500,
    details: any = null,
    isBackendUnavailable: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isBackendUnavailable = isBackendUnavailable;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `/api${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string" && !options.body.startsWith("id,")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      let errPayload: any = {};
      try {
        errPayload = await res.json();
      } catch {
        errPayload = {
          error: {
            message: `Request failed with status ${res.status}`,
            code: "HTTP_ERROR"
          }
        };
      }

      const errObj = errPayload.error || errPayload;
      throw new ApiError(
        errObj.message || `HTTP ${res.status}: ${res.statusText}`,
        errObj.code || (res.status === 409 ? "CONFLICT" : "REQUEST_FAILED"),
        res.status,
        errObj.details
      );
    }

    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    console.error("Backend request error:", err);
    throw new ApiError(
      "Unable to reach ColdChain Intelligence server. Using offline state.",
      "BACKEND_UNAVAILABLE",
      0,
      null,
      true
    );
  }
}

export const apiClient = {
  // Health
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/health");
      return res.ok;
    } catch {
      return false;
    }
  },

  // Shipments
  getShipments: async (params: { q?: string; status?: string; category?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status && params.status !== "ALL") qs.set("status", params.status);
    if (params.category && params.category !== "ALL") qs.set("category", params.category);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const query = qs.toString();
    const result = await request<{ data: any[]; shipments?: any[]; total?: number }>(`/shipments${query ? `?${query}` : ""}`);
    return result.data || result.shipments || result;
  },

  getShipment: async (id: string) => {
    const result = await request<{ data: any; shipment?: any }>(`/shipments/${encodeURIComponent(id)}`);
    return result.data || result.shipment || result;
  },

  createShipment: async (shipmentData: any) => {
    return await request("/shipments", {
      method: "POST",
      body: JSON.stringify(shipmentData)
    });
  },

  updateShipment: async (id: string, shipmentData: any) => {
    return await request(`/shipments/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(shipmentData)
    });
  },

  deleteShipment: async (id: string) => {
    return await request(`/shipments/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  },

  resetDemoData: async () => {
    return await request("/shipments/reset", {
      method: "POST"
    });
  },

  // Driver Persona Endpoints
  reportIncident: async (payload: {
    shipmentId: string;
    incidentType: string;
    label?: string;
    delayMinutes?: number;
    tempIncreaseC?: number;
    tempDeltaC?: number;
    notes?: string;
    location?: string;
    ambientC?: number;
    reporter?: string;
  }) => {
    return await request("/driver/incident", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateDriverStatus: async (payload: {
    shipmentId: string;
    transitStatus?: string;
    progressPct?: number;
    currentLocation?: string;
  }) => {
    return await request("/driver/status", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Receiver Persona Endpoints
  recordReceiverDecision: async (payload: {
    shipmentId: string;
    disposition: "ACCEPT" | "QUARANTINE" | "REJECT" | string;
    inspectorName?: string;
    notes?: string;
    criteria?: Record<string, boolean>;
    timestamp?: string;
  }) => {
    return await request("/receiver/decision", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Thermal Simulation Engine Endpoints
  runAnalysis: async (shipmentId: string) => {
    return await request(`/analysis/${encodeURIComponent(shipmentId)}`, {
      method: "POST"
    });
  },

  getAnalysis: async (shipmentId: string) => {
    return await request(`/analysis/${encodeURIComponent(shipmentId)}`);
  }
};

export default apiClient;
