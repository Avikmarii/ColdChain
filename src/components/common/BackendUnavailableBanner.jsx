import React from "react";
import { ServerOff, RefreshCw } from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";

export default function BackendUnavailableBanner() {
  const { state, refreshShipments } = useShipments();

  if (!state.isBackendUnavailable && !state.error) return null;

  return (
    <div
      style={{
        background: "var(--danger-pale)",
        border: "1px solid rgba(224, 82, 96, 0.4)",
        borderRadius: "var(--radius-md)",
        padding: "12px 18px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ServerOff size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: "var(--danger)", fontSize: 14 }}>
            {state.isBackendUnavailable ? "Backend Service Unavailable" : "Database Communication Error"}
          </strong>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {state.error || "Could not connect to the ColdChain Intelligence server endpoints. Ensure server is active."}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="cc-btn cc-btn-secondary cc-btn-sm"
        onClick={refreshShipments}
        style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "#FFFFFF" }}
      >
        <RefreshCw size={13} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
