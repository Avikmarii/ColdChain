import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Search, ChevronRight, Thermometer, Clock, MapPin, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";
import ProvenanceBanner from "../../components/common/ProvenanceBanner";

export default function DriverShipmentList() {
  const navigate = useNavigate();
  const { state } = useShipments();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const shipments = state.shipments || [];

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      `${s.origin} ${s.destination}`.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "ALL") return true;
    if (filter === "IN_TRANSIT") return s.transitStatus === "IN_TRANSIT";
    if (filter === "ARRIVED") return s.transitStatus === "ARRIVED";
    if (filter === "SCHEDULED") return s.transitStatus === "SCHEDULED";
    return true;
  });

  return (
    <div className="cc-driver-page">
      <ProvenanceBanner text="Demo simulation: illustrative driver guidance environment. Telemetry points are simulated." />

      <div className="cc-page-header">
        <div>
          <div className="cc-page-pretitle">Driver Cockpit • Fleet In-Transit Operations</div>
          <h1 className="cc-page-title">Active Delivery Manifests</h1>
          <p className="cc-page-description">
            Select an active shipment manifest to monitor cabin refrigeration telemetry, log en-route traffic incidents, and generate digital custody handover tokens.
          </p>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="cc-filter-bar">
        <div className="cc-search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} className="cc-search-icon" />
          <input
            type="search"
            className="cc-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search manifests by ID, product, or corridor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="cc-tab-group" role="tablist">
          <button
            type="button"
            className={`cc-tab-btn ${filter === "ALL" ? "is-active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All Loads ({shipments.length})
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "IN_TRANSIT" ? "is-active" : ""}`}
            onClick={() => setFilter("IN_TRANSIT")}
          >
            In-Transit
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "SCHEDULED" ? "is-active" : ""}`}
            onClick={() => setFilter("SCHEDULED")}
          >
            Scheduled
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "ARRIVED" ? "is-active" : ""}`}
            onClick={() => setFilter("ARRIVED")}
          >
            Arrived
          </button>
        </div>
      </div>

      {/* Manifest Cards Grid */}
      <div className="cc-driver-grid">
        {filtered.length === 0 ? (
          <div className="cc-card cc-empty-box" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 24px" }}>
            <Truck size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No manifests match your filter</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Try adjusting your search criteria or switch to All Loads.
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const minC = s.temperatureLimits?.minC ?? 2.0;
            const maxC = s.temperatureLimits?.maxC ?? 8.0;
            const currentTemp = s.currentTempC ?? 4.4;
            const isExcursion = currentTemp < minC || currentTemp > maxC;
            const status = s.transitStatus || "IN_TRANSIT";

            return (
              <div
                key={s.id}
                className="cc-card cc-driver-card"
                onClick={() => navigate(`/driver/${encodeURIComponent(s.id)}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/driver/${encodeURIComponent(s.id)}`);
                  }
                }}
              >
                <div className="cc-driver-card-top">
                  <div>
                    <span className="cc-mono cc-driver-id">{s.id}</span>
                    <h3 className="cc-driver-name">{s.name}</h3>
                  </div>
                  <span
                    className={`cc-badge ${
                      status === "ARRIVED"
                        ? "cc-badge-recommended"
                        : status === "IN_TRANSIT"
                        ? "cc-badge-analyzed"
                        : "cc-badge-draft"
                    }`}
                  >
                    {status === "ARRIVED" ? (
                      <CheckCircle2 size={12} />
                    ) : status === "IN_TRANSIT" ? (
                      <Truck size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    <span>{status === "IN_TRANSIT" ? "In Transit" : status === "ARRIVED" ? "Arrived" : "Scheduled"}</span>
                  </span>
                </div>

                <div className="cc-driver-route">
                  <MapPin size={15} style={{ color: "var(--brand-blue)", flexShrink: 0 }} />
                  <span>
                    <strong>{s.origin}</strong> → <strong>{s.destination}</strong>
                  </span>
                </div>

                <div className="cc-driver-card-telemetry">
                  <div className="cc-telemetry-col">
                    <span className="cc-telemetry-label">Compartment Temp</span>
                    <span
                      className="cc-telemetry-val cc-tabular"
                      style={{ color: isExcursion ? "var(--danger)" : "var(--brand-blue-deep)" }}
                    >
                      <Thermometer size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                      {currentTemp}°C
                    </span>
                    <span className="cc-telemetry-target">
                      Target: {minC}°C – {maxC}°C
                    </span>
                  </div>

                  <div className="cc-telemetry-col">
                    <span className="cc-telemetry-label">Transit Delay</span>
                    <span className="cc-telemetry-val cc-tabular">
                      {s.transitDelayMin > 0 ? `+${s.transitDelayMin}m` : "On schedule"}
                    </span>
                    <span className="cc-telemetry-target">
                      Limit: {s.maxTransitHours}h max
                    </span>
                  </div>
                </div>

                <div className="cc-driver-card-footer">
                  <span className="cc-driver-carrier">
                    Driver: {s.assignedDriver || "Fleet Navigator"}
                  </span>
                  <span className="cc-driver-cta">
                    Open Cockpit <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
