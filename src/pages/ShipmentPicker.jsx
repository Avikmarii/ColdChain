import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, ArrowRight, Route, Sliders } from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import EmptyState from "../components/common/EmptyState";
import ProvenanceBanner from "../components/common/ProvenanceBanner";

export default function ShipmentPicker() {
  const location = useLocation();
  const { state } = useShipments();
  const isScenario = location.pathname.includes("scenarios");

  const title = isScenario ? "Choose a shipment for scenario testing" : "Choose a shipment to analyse";
  const subtitle = isScenario
    ? "Select an existing shipment to simulate delays, ambient temperature surges, or cooling interruptions."
    : "Select a shipment to evaluate candidate highway routes and thermal behaviour.";

  return (
    <div>
      <ProvenanceBanner text="Demo simulation: illustrative results only." />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16
        }}
      >
        <div>
          <h1>{title}</h1>
          <p style={{ marginTop: 4, fontSize: 14 }}>{subtitle}</p>
        </div>

        <Link to="/shipments/new" className="cc-btn cc-btn-primary">
          <Plus size={16} />
          <span>+ New Shipment</span>
        </Link>
      </div>

      {state.shipments.length === 0 ? (
        <EmptyState
          title="No shipments found"
          description="Create your first shipment to begin evaluating transportation routes."
          action={
            <Link to="/shipments/new" className="cc-btn cc-btn-primary">
              <Plus size={16} />
              <span>Create Shipment</span>
            </Link>
          }
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16
          }}
        >
          {state.shipments.map((s) => {
            const targetUrl = isScenario
              ? `/shipments/${s.id}/scenarios`
              : `/shipments/${s.id}/analysis`;

            return (
              <div
                key={s.id}
                className="cc-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8
                    }}
                  >
                    <CopyId id={s.id} />
                    <StatusBadge status={s.status} />
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{s.name}</h3>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {s.origin} → {s.destination}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 6
                    }}
                  >
                    Product: {s.category} • Range: {s.temperatureLimits.minC}°C to {s.temperatureLimits.maxC}°C
                  </div>
                </div>

                <Link
                  to={targetUrl}
                  className="cc-btn cc-btn-secondary"
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isScenario ? <Sliders size={15} /> : <Route size={15} />}
                    <span>{isScenario ? "Open Simulator" : "Compare Routes"}</span>
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
