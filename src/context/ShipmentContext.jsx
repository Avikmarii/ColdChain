import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { api, ApiServiceError } from "../services/api";
import { SEED_SHIPMENTS } from "../data/demoShipments";

const SHIPMENTS_STORAGE_KEY = "coldchain:v1";
const SETTINGS_KEY = "coldchain:settings:v1";
const DRAFT_KEY = "coldchain:formDraft:v1";
const PERSONA_KEY = "coldchain:persona:v1";

const initialSettings = {
  brandLabel: "ColdChain Intelligence",
  temperatureUnit: "C",
  reduceMotion: false
};

export function ensureShipmentTransitFields(s) {
  if (!s) return s;
  const now = new Date();

  // Status mapping
  const transitStatus =
    s.transitStatus ||
    (s.disposition
      ? "ARRIVED"
      : s.status === "Accepted" || s.status === "Quarantined" || s.status === "Rejected"
      ? "ARRIVED"
      : s.status === "Recommended" || s.status === "Analyzed"
      ? "IN_TRANSIT"
      : "SCHEDULED");

  const assignedDriver = s.assignedDriver || "Fleet Navigator (Assigned)";

  // Default telemetry points if not present
  let telemetry = Array.isArray(s.telemetry) && s.telemetry.length > 0 ? s.telemetry : null;
  if (!telemetry) {
    const baseTemp = s.category === "Vaccine" ? 4.2 : 4.6;
    const count = 10;
    telemetry = [];
    for (let i = 0; i < count; i++) {
      const pointTime = new Date(now.getTime() - (count - 1 - i) * 15 * 60 * 1000).toISOString();
      const variance = Math.sin(i * 0.9) * 0.4 + ((i % 3) * 0.1);
      const tempC = Number((baseTemp + variance).toFixed(1));
      telemetry.push({
        timestamp: pointTime,
        tempC,
        location:
          i < 3
            ? `${s.origin} Dispatch Bay`
            : i < 7
            ? "Highway Corridor Checkpoint"
            : `${s.destination} Approach`,
        ambientC: 32.0
      });
    }
  }

  const currentTempC =
    typeof s.currentTempC === "number"
      ? s.currentTempC
      : telemetry[telemetry.length - 1]?.tempC ?? 4.4;

  const transitDelayMin = typeof s.transitDelayMin === "number" ? s.transitDelayMin : 0;
  const progressPct =
    typeof s.progressPct === "number"
      ? s.progressPct
      : transitStatus === "ARRIVED"
      ? 100
      : transitStatus === "IN_TRANSIT"
      ? 65
      : 10;

  const incidents = Array.isArray(s.incidents) ? s.incidents : [];
  const disposition = s.disposition ?? null;

  return {
    ...s,
    transitStatus,
    assignedDriver,
    telemetry,
    currentTempC,
    transitDelayMin,
    progressPct,
    incidents,
    disposition
  };
}

function loadStoredSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...initialSettings, ...JSON.parse(raw) } : initialSettings;
  } catch {
    return initialSettings;
  }
}

function loadStoredDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadStoredPersona() {
  try {
    const raw = localStorage.getItem(PERSONA_KEY);
    return raw && ["manager", "driver", "receiving"].includes(raw) ? raw : "manager";
  } catch {
    return "manager";
  }
}

function loadStoredShipments() {
  try {
    const raw = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(ensureShipmentTransitFields);
      }
    }
  } catch (e) {
    console.warn("Could not read stored shipments from localStorage", e);
  }
  return SEED_SHIPMENTS.map(ensureShipmentTransitFields);
}

const initialShipments = loadStoredShipments();

const initialState = {
  shipments: initialShipments,
  isLoading: false,
  error: null,
  isBackendUnavailable: false,
  formDraft: loadStoredDraft(),
  settings: loadStoredSettings(),
  activePersona: loadStoredPersona(),
  toasts: [],
  activeSearchQuery: ""
};

function shipmentReducer(state, action) {
  let nextShipments = state.shipments;

  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: state.shipments.length === 0, error: null, isBackendUnavailable: false };

    case "FETCH_SUCCESS": {
      const merged = (action.payload || []).map((fetched) => {
        const local = state.shipments.find((s) => s.id === fetched.id);
        const combined = { ...fetched, ...local };
        return ensureShipmentTransitFields(combined);
      });
      // Also preserve any newly created local shipments that server might not have yet
      const missingLocals = state.shipments.filter((s) => !merged.some((m) => m.id === s.id));
      nextShipments = [...merged, ...missingLocals];
      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not cache shipments", e);
      }
      return {
        ...state,
        isLoading: false,
        error: null,
        isBackendUnavailable: false,
        shipments: nextShipments
      };
    }

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload.message,
        isBackendUnavailable: Boolean(action.payload.isBackendUnavailable)
      };

    case "SET_PERSONA": {
      try {
        localStorage.setItem(PERSONA_KEY, action.payload);
      } catch (e) {
        console.warn("Could not save persona", e);
      }
      return { ...state, activePersona: action.payload };
    }

    case "UPSERT_LOCAL_SHIPMENT": {
      const updated = ensureShipmentTransitFields(action.payload);
      const exists = state.shipments.some((s) => s.id === updated.id);
      nextShipments = exists
        ? state.shipments.map((s) => (s.id === updated.id ? updated : s))
        : [updated, ...state.shipments];

      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "UPDATE_SHIPMENT": {
      const { originalId, updatedShipment } = action.payload.originalId
        ? action.payload
        : { originalId: action.payload.id, updatedShipment: action.payload };

      nextShipments = state.shipments.map((s) =>
        s.id === originalId
          ? ensureShipmentTransitFields({ ...s, ...updatedShipment, updatedAt: new Date().toISOString() })
          : s
      );

      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "REMOVE_LOCAL_SHIPMENT": {
      nextShipments = state.shipments.filter((s) => s.id !== action.payload);
      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "RECORD_DRIVER_INCIDENT": {
      const { shipmentId, incident } = action.payload;
      const nowIso = incident.timestamp || new Date().toISOString();

      nextShipments = state.shipments.map((s) => {
        if (s.id !== shipmentId) return s;

        const currentIncidents = Array.isArray(s.incidents) ? [...s.incidents] : [];
        const newIncident = {
          id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: incident.type, // 'DELAY', 'REEFER_SPIKE', 'REEFER_RESTORED', 'NOTE'
          label: incident.label,
          notes: incident.notes || "",
          timestamp: nowIso,
          delayMinutes: incident.delayMinutes || 0,
          tempDeltaC: incident.tempDeltaC || 0,
          provenance: "user-reported"
        };
        currentIncidents.unshift(newIncident);

        const newDelay = (s.transitDelayMin || 0) + (incident.delayMinutes || 0);
        const newTempC = Number(
          Math.max(
            -20,
            Math.min(45, (s.currentTempC || 4.2) + (incident.tempDeltaC || 0))
          ).toFixed(1)
        );

        const currentTelemetry = Array.isArray(s.telemetry) ? [...s.telemetry] : [];
        currentTelemetry.push({
          timestamp: nowIso,
          tempC: newTempC,
          location: incident.location || s.currentLocation || "In-Transit Telemetry Point",
          ambientC: incident.ambientC || 33.0,
          incidentId: newIncident.id
        });

        const activity = Array.isArray(s.activity) ? [...s.activity] : [];
        activity.unshift({
          at: nowIso,
          text: `Driver Log: ${incident.label}${incident.notes ? ` (${incident.notes})` : ""}`,
          provenance: "user-reported"
        });

        return {
          ...s,
          currentTempC: newTempC,
          transitDelayMin: newDelay,
          incidents: currentIncidents,
          telemetry: currentTelemetry,
          activity,
          updatedAt: nowIso
        };
      });

      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "UPDATE_TRANSIT_STATUS": {
      const { shipmentId, transitStatus, progressPct, currentLocation } = action.payload;
      const nowIso = new Date().toISOString();

      nextShipments = state.shipments.map((s) => {
        if (s.id !== shipmentId) return s;

        const activity = Array.isArray(s.activity) ? [...s.activity] : [];
        if (transitStatus && transitStatus !== s.transitStatus) {
          const statusText =
            transitStatus === "ARRIVED"
              ? "Driver arrived at receiving clinic for custody handover"
              : transitStatus === "IN_TRANSIT"
              ? "Driver marked shipment in transit"
              : `Transit status changed to ${transitStatus}`;

          activity.unshift({
            at: nowIso,
            text: statusText,
            provenance: "user-reported"
          });
        }

        return {
          ...s,
          transitStatus: transitStatus || s.transitStatus,
          progressPct: typeof progressPct === "number" ? progressPct : s.progressPct,
          currentLocation: currentLocation || s.currentLocation,
          updatedAt: nowIso,
          activity
        };
      });

      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "RECORD_DISPOSITION": {
      const { shipmentId, disposition, inspectorName, notes, criteria, timestamp } = action.payload;
      const nowIso = timestamp || new Date().toISOString();

      const newStatus =
        disposition === "ACCEPT"
          ? "Accepted"
          : disposition === "QUARANTINE"
          ? "Quarantined"
          : "Rejected";

      nextShipments = state.shipments.map((s) => {
        if (s.id !== shipmentId) return s;

        const activity = Array.isArray(s.activity) ? [...s.activity] : [];
        activity.unshift({
          at: nowIso,
          text: `Receiving Clinic Disposition: Batch marked [${disposition}] by Inspector ${inspectorName || "Clinic QA"}${notes ? ` - ${notes}` : ""}`,
          provenance: "user-reported"
        });

        return {
          ...s,
          status: newStatus,
          transitStatus: "ARRIVED",
          progressPct: 100,
          disposition: {
            status: disposition,
            inspectorName: inspectorName || "Receiving Pharmacist / QA",
            notes: notes || "",
            criteria: criteria || {},
            inspectedAt: nowIso
          },
          activity,
          updatedAt: nowIso
        };
      });

      try {
        localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(nextShipments));
      } catch (e) {
        console.warn("Could not write shipments to localStorage", e);
      }
      return { ...state, shipments: nextShipments };
    }

    case "SAVE_FORM_DRAFT":
      return { ...state, formDraft: action.payload };

    case "CLEAR_FORM_DRAFT":
      return { ...state, formDraft: null };

    case "SET_SETTINGS": {
      const nextSettings = { ...state.settings, ...action.payload };
      return { ...state, settings: nextSettings };
    }

    case "ADD_TOAST": {
      const newToast = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        title: action.payload.title,
        message: action.payload.message || "",
        type: action.payload.type || "info",
        duration: action.payload.duration || 4000
      };
      const sliced = state.toasts.slice(-2);
      return { ...state, toasts: [...sliced, newToast] };
    }

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload)
      };

    case "SET_SEARCH_QUERY":
      return { ...state, activeSearchQuery: action.payload };

    default:
      return state;
  }
}

const ShipmentContext = createContext(null);

export function ShipmentProvider({ children }) {
  const [state, dispatch] = useReducer(shipmentReducer, initialState);

  // Sync settings and form draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    } catch (e) {
      console.warn("Could not persist settings to localStorage", e);
    }
  }, [state.settings]);

  useEffect(() => {
    try {
      if (state.formDraft) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state.formDraft));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (e) {
      console.warn("Could not persist form draft to localStorage", e);
    }
  }, [state.formDraft]);

  // Sync reduced motion
  useEffect(() => {
    if (state.settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [state.settings.reduceMotion]);

  // Fetch shipments from server
  const refreshShipments = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const res = await api.getShipments();
      if (res && res.data) {
        dispatch({ type: "FETCH_SUCCESS", payload: res.data });
      }
    } catch (err) {
      // Backend unavailable is non-fatal since we have localStorage sync
      dispatch({
        type: "FETCH_ERROR",
        payload: {
          message: err.message || "Working in offline/local mode.",
          isBackendUnavailable: err.isBackendUnavailable || false
        }
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshShipments();
  }, [refreshShipments]);

  const showToast = (title, message = "", type = "info", duration = 4000) => {
    dispatch({
      type: "ADD_TOAST",
      payload: { title, message, type, duration }
    });
  };

  const addToast = (message, type = "info", duration = 4000) => {
    dispatch({
      type: "ADD_TOAST",
      payload: { title: type === "error" ? "Error" : "Notification", message, type, duration }
    });
  };

  const setPersona = (persona) => {
    dispatch({ type: "SET_PERSONA", payload: persona });
  };

  const recordDriverIncident = async (shipmentId, incident) => {
    dispatch({
      type: "RECORD_DRIVER_INCIDENT",
      payload: { shipmentId, incident }
    });

    try {
      const res = await api.reportIncident({
        shipmentId,
        incidentType: incident.type,
        label: incident.label,
        delayMinutes: incident.delayMinutes || 0,
        tempDeltaC: incident.tempDeltaC || 0,
        notes: incident.notes || "",
        location: incident.location,
        ambientC: incident.ambientC
      });
      if (res && (res.shipment || res.data)) {
        dispatch({
          type: "UPDATE_SHIPMENT",
          payload: { originalId: shipmentId, updatedShipment: res.shipment || res.data }
        });
      }
    } catch (err) {
      console.warn("Backend report incident sync fallback to local state:", err);
    }
  };

  const updateTransitStatus = async (shipmentId, statusData) => {
    dispatch({
      type: "UPDATE_TRANSIT_STATUS",
      payload: { shipmentId, ...statusData }
    });

    try {
      const res = await api.updateDriverStatus({
        shipmentId,
        transitStatus: statusData.transitStatus,
        progressPct: statusData.progressPct,
        currentLocation: statusData.currentLocation
      });
      if (res && (res.shipment || res.data)) {
        dispatch({
          type: "UPDATE_SHIPMENT",
          payload: { originalId: shipmentId, updatedShipment: res.shipment || res.data }
        });
      }
    } catch (err) {
      console.warn("Backend transit status sync fallback to local state:", err);
    }
  };

  const recordDisposition = async (shipmentId, dispositionData) => {
    dispatch({
      type: "RECORD_DISPOSITION",
      payload: { shipmentId, ...dispositionData }
    });

    try {
      const res = await api.recordReceiverDecision({
        shipmentId,
        disposition: dispositionData.disposition,
        inspectorName: dispositionData.inspectorName,
        notes: dispositionData.notes,
        criteria: dispositionData.criteria,
        timestamp: dispositionData.timestamp
      });
      if (res && (res.shipment || res.data)) {
        dispatch({
          type: "UPDATE_SHIPMENT",
          payload: { originalId: shipmentId, updatedShipment: res.shipment || res.data }
        });
      }
    } catch (err) {
      console.warn("Backend disposition sync fallback to local state:", err);
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await api.resetDemoData();
      if (res && res.data) {
        dispatch({ type: "FETCH_SUCCESS", payload: res.data });
      } else {
        await refreshShipments();
      }
      showToast("Demo Data Reset", "Shipments reset to canonical initial test suite.", "success");
    } catch (err) {
      console.warn("Backend reset error, resetting local store:", err);
      dispatch({ type: "FETCH_SUCCESS", payload: SEED_SHIPMENTS.map(ensureShipmentTransitFields) });
      showToast("Demo Data Reset", "Reset to initial test suite.", "info");
    }
  };

  const getShipmentById = (id) => {
    if (!id) return null;
    try {
      const decoded = decodeURIComponent(id).toLowerCase();
      return state.shipments.find((s) => s.id?.toLowerCase() === decoded) || null;
    } catch {
      return state.shipments.find((s) => s.id?.toLowerCase() === id.toLowerCase()) || null;
    }
  };

  const value = {
    state,
    dispatch,
    showToast,
    addToast,
    refreshShipments,
    getShipmentById,
    setPersona,
    recordDriverIncident,
    updateTransitStatus,
    recordDisposition,
    resetDemoData
  };

  return (
    <ShipmentContext.Provider value={value}>
      {children}
    </ShipmentContext.Provider>
  );
}

export function useShipments() {
  const ctx = useContext(ShipmentContext);
  if (!ctx) {
    throw new Error("useShipments must be used within a ShipmentProvider");
  }
  return ctx;
}
