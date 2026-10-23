import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { api, ApiServiceError } from "../services/api";

const SETTINGS_KEY = "coldchain:settings:v1";
const DRAFT_KEY = "coldchain:formDraft:v1";

const initialSettings = {
  brandLabel: "ColdChain Intelligence",
  temperatureUnit: "C",
  reduceMotion: false
};

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

const initialState = {
  shipments: [],
  isLoading: true,
  error: null,
  isBackendUnavailable: false,
  formDraft: loadStoredDraft(),
  settings: loadStoredSettings(),
  toasts: [],
  activeSearchQuery: ""
};

function shipmentReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null, isBackendUnavailable: false };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        error: null,
        isBackendUnavailable: false,
        shipments: action.payload
      };

    case "FETCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload.message,
        isBackendUnavailable: Boolean(action.payload.isBackendUnavailable)
      };

    case "UPSERT_LOCAL_SHIPMENT": {
      const updated = action.payload;
      const exists = state.shipments.some((s) => s.id === updated.id);
      const next = exists
        ? state.shipments.map((s) => (s.id === updated.id ? updated : s))
        : [updated, ...state.shipments];
      return { ...state, shipments: next };
    }

    case "REMOVE_LOCAL_SHIPMENT":
      return {
        ...state,
        shipments: state.shipments.filter((s) => s.id !== action.payload)
      };

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
      const sliced = state.toasts.slice(-1);
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

  // Sync settings and form draft to localStorage (Requirement 3)
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
      dispatch({ type: "FETCH_SUCCESS", payload: res.data || [] });
    } catch (err) {
      dispatch({
        type: "FETCH_ERROR",
        payload: {
          message: err.message || "Failed to load shipments from backend.",
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

  const getShipmentById = (id) => {
    return state.shipments.find((s) => s.id === id) || null;
  };

  const value = {
    state,
    dispatch,
    showToast,
    refreshShipments,
    getShipmentById
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
