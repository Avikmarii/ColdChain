import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Thermometer
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";
import ProvenanceBanner from "../../components/common/ProvenanceBanner";
import { evaluateThermalIntegrity } from "../../utils/mkt";

export default function ReceivingList() {
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
    if (filter === "AWAITING") return s.status !== "Accepted" && s.status !== "Rejected" && s.status !== "Quarantined";
    if (filter === "ACCEPTED") return s.status === "Accepted";
    if (filter === "QUARANTINED") return s.status === "Quarantined";
    if (filter === "REJECTED") return s.status === "Rejected";
    return true;
  });

  return (
    <div className="cc-receiving-page">
      <ProvenanceBanner text="Demo simulation: illustrative hospital receiving and inspection portal. Values reflect simulated thermal models." />

      <div className="cc-page-header">
        <div>
          <div className="cc-page-pretitle">Hospital Receiving • Clinical QA & Intake</div>
          <h1 className="cc-page-title">Cold-Chain Intake Queue</h1>
          <p className="cc-page-description">
            Inspect arriving consignments against 2°C to 8°C temperature integrity criteria, evaluate simulated Mean Kinetic Temperature (MKT), and record clinical disposition.
          </p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="cc-filter-bar">
        <div className="cc-search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} className="cc-search-icon" />
          <input
            type="search"
            className="cc-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search manifests by ID, product, or hospital..."
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
            All Intake ({shipments.length})
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "AWAITING" ? "is-active" : ""}`}
            onClick={() => setFilter("AWAITING")}
          >
            Awaiting Inspection
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "ACCEPTED" ? "is-active" : ""}`}
            onClick={() => setFilter("ACCEPTED")}
          >
            Accepted
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "QUARANTINED" ? "is-active" : ""}`}
            onClick={() => setFilter("QUARANTINED")}
          >
            Quarantined
          </button>
          <button
            type="button"
            className={`cc-tab-btn ${filter === "REJECTED" ? "is-active" : ""}`}
            onClick={() => setFilter("REJECTED")}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Receiving Manifest Table / Cards */}
      <div className="cc-receiving-table-card cc-card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Building2 size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>No consignments found</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Try adjusting your filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="cc-table-responsive">
            <table className="cc-data-table">
              <thead>
                <tr>
                  <th>Shipment ID</th>
                  <th>Product / Cargo</th>
                  <th>Route Corridor</th>
                  <th>Carrier / Driver</th>
                  <th>Thermal Compliance</th>
                  <th>Intake Disposition</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const limits = {
                    minC: s.temperatureLimits?.minC ?? 2.0,
                    maxC: s.temperatureLimits?.maxC ?? 8.0
                  };
                  const thermal = evaluateThermalIntegrity(s.telemetry || [], limits);
                  const isAccepted = s.status === "Accepted";
                  const isQuarantined = s.status === "Quarantined";
                  const isRejected = s.status === "Rejected";

                  return (
                    <tr key={s.id} onClick={() => navigate(`/receiving/${encodeURIComponent(s.id)}`)} style={{ cursor: "pointer" }}>
                      <td>
                        <span className="cc-mono cc-table-id">{s.id}</span>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.category}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {s.container?.coolingSystem || "Active Refrigerated"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {s.origin} → <strong>{s.destination}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Departed: {s.departureDateTime ? new Date(s.departureDateTime).toLocaleDateString() : "Scheduled"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.assignedDriver || "Fleet Carrier"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          Delay: {s.transitDelayMin > 0 ? `+${s.transitDelayMin}m` : "On time"}
                        </div>
                      </td>
                      <td>
                        {thermal.hasData ? (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                              <Thermometer size={14} style={{ color: thermal.excursionMinutes > 0 ? "var(--danger)" : "var(--success)" }} />
                              <span className="cc-tabular" style={{ fontWeight: 600 }}>
                                MKT: {thermal.mkt !== null ? `${thermal.mkt}°C` : "N/A"}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: thermal.excursionMinutes > 0 ? "var(--danger)" : "var(--text-muted)", marginTop: 2 }}>
                              {thermal.excursionMinutes > 0 ? `${thermal.excursionMinutes}m excursion` : "No excursions logged"}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Not yet evaluated</span>
                        )}
                      </td>
                      <td>
                        {isAccepted && (
                          <span className="cc-badge cc-badge-recommended">
                            <CheckCircle2 size={12} /> Accepted
                          </span>
                        )}
                        {isQuarantined && (
                          <span className="cc-badge cc-badge-draft" style={{ background: "var(--warning-pale)", color: "var(--warning)" }}>
                            <AlertTriangle size={12} /> Quarantined
                          </span>
                        )}
                        {isRejected && (
                          <span className="cc-badge cc-badge-no-feasible">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                        {!isAccepted && !isQuarantined && !isRejected && (
                          <span className="cc-badge cc-badge-analyzed">
                            <Clock size={12} /> Awaiting Inspection
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="cc-btn cc-btn-sm cc-btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/receiving/${encodeURIComponent(s.id)}`);
                          }}
                        >
                          <ShieldCheck size={14} /> Inspect Batch
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
