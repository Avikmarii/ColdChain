import React, { createContext, useContext, useReducer, useEffect } from "react";
import { SEED_SHIPMENTS } from "../data/demoShipments";

const STORAGE_KEY = "coldchain:v1";

const initialSettings = {
  brandLabel: "ColdChain Intelligence",
  temperatureUnit: "C",
  reduceMotion: false
};

const initialState = {
  shipments: SEED_SHIPMENTS,
  formDraft: null,
  settings: initialSettings,
  toasts: [],
  activeSearchQuery: ""
};

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      shipments: Array.isArray(parsed.shipments) && parsed.shipments.length > 0 ? parsed.shipments : SEED_SHIPMENTS,
      settings: { ...initialSettings, ...(parsed.settings || {}) },
      formDraft: parsed.formDraft || null
    };
  } catch (err) {
    console.warn("Error loading stored ColdChain state, falling back to seeds:", err);
    return initialState;
  }
}

function shipmentReducer(state, action) {
  switch (action.type) {
    case "SET_SHIPMENTS":
      return { ...state, shipments: action.payload };

    case "ADD_SHIPMENT": {
      const nextShipments = [action.payload, ...state.shipments];
      return { ...state, shipments: nextShipments, formDraft: null };
    }

    case "UPDATE_SHIPMENT": {
      const updated = action.payload;
      const nextShipments = state.shipments.map(s => (s.id === updated.id ? updated : s));
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

    case "RESET_DEMO_DATA":
      return {
        ...state,
        shipments: SEED_SHIPMENTS,
        formDraft: null
      };

    case "REMOVE_IMPORTED_RECORDS": {
      const filtered = state.shipments.filter(s => s.source !== "imported");
      return { ...state, shipments: filtered };
    }

    case "ADD_TOAST": {
      const newToast = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        title: action.payload.title,
        message: action.payload.message || "",
        type: action.payload.type || "info", // "info", "success", "warning", "error"
        duration: action.payload.duration || 4000
      };
      // Keep at most 2 toasts visible as required
      const sliced = state.toasts.slice(-1);
      return { ...state, toasts: [...sliced, newToast] };
    }

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      };

    case "SET_SEARCH_QUERY":
      return { ...state, activeSearchQuery: action.payload };

    default:
      return state;
  }
}

const ShipmentContext = createContext(null);

export function ShipmentProvider({ children }) {
  const [state, dispatch] = useReducer(shipmentReducer, null, loadStoredState);

  // Sync to localStorage
  useEffect(() => {
    try {
      const toSave = {
        shipments: state.shipments,
        settings: state.settings,
        formDraft: state.formDraft
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn("Failed to persist ColdChain state to localStorage:", err);
    }
  }, [state.shipments, state.settings, state.formDraft]);

  // Sync reduced motion override with document root
  useEffect(() => {
    if (state.settings.reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [state.settings.reduceMotion]);

  // Toast dispatch helpers
  const showToast = (title, message = "", type = "info", duration = 4000) => {
    dispatch({
      type: "ADD_TOAST",
      payload: { title, message, type, duration }
    });
  };

  const getShipmentById = (id) => {
    return state.shipments.find(s => s.id === id) || null;
  };

  const value = {
    state,
    dispatch,
    showToast,
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
