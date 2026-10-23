import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Sliders,
  Edit,
  Truck,
  UserCheck,
  Clock,
  Thermometer,
  Box,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import Modal from "../components/common/Modal";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import NotFound from "./NotFound";

export default function ShipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipmentById, showToast } = useShipments();
  const shipment = getShipmentById(id);

  const [showDriverModal, setShowDriverModal] = useState(false);

  if (!shipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`We could not locate shipment record with ID "${id}".`}
      />
    );
  }

  const isDraft = shipment.status === "Draft";
  const isAnalyzed = Boolean(shipment.analysis);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Not connected to live physical sensor telemetry." />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/"
          className="cc-btn cc-btn-ghost cc-btn-sm"
          style={{ marginBottom: 6, paddingLeft: 0, display: "inline-flex" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1>{shipment.name}</h1>
              <CopyId id={shipment.id} />
              <StatusBadge status={shipment.status} />
              <span
                className={`cc-badge ${
                  shipment.source === "imported"
                    ? "cc-badge-provenance-imported"
                    : shipment.isDemoRecord
                    ? "cc-badge-provenance-demo"
                    : "cc-badge-provenance-simulated"
                }`}
              >
                {shipment.source === "imported"
                  ? "User-imported (unverified)"
                  : shipment.isDemoRecord
                  ? "Demo"
                  : "Simulated"}
              </span>
            </div>
            <p style={{ marginTop: 4, fontSize: 14 }}>
              Corridor: <strong>{shipment.origin} → {shipment.destination}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => setShowDriverModal(true)}
            >
              <UserCheck size={15} />
              <span>{shipment.assignedDriver ? `Driver: ${shipment.assignedDriver}` : "Assign Driver"}</span>
            </button>

            <Link
              to={`/shipments/${shipment.id}/edit`}
              className="cc-btn cc-btn-secondary"
            >
              <Edit size={15} />
              <span>Edit Shipment</span>
            </Link>

            {isDraft ? (
              <Link
                to={`/shipments/${shipment.id}/analysis`}
                className="cc-btn cc-btn-primary"
              >
                <Play size={15} />
                <span>Run Route Analysis</span>
              </Link>
            ) : (
              <Link
                to={`/shipments/${shipment.id}/results`}
                className="cc-btn cc-btn-primary"
              >
                <span>View Results</span>
                <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Journey Card */}
        <div className="cc-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Truck size={17} color="var(--brand-blue)" />
            <h3 style={{ fontSize: 15 }}>Journey & Corridor</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Origin:</span>{" "}
              <strong>{shipment.origin}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Destination:</span>{" "}
              <strong>{shipment.destination}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Departure:</span>{" "}
              <span>{shipment.departureDateTime?.replace("T", " ") || "Unspecified"}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Max Transit Time:</span>{" "}
              <strong>{shipment.maxTransitHours} hours</strong>
            </div>
          </div>
        </div>

        {/* Temperature Specs */}
        <div className="cc-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Thermometer size={17} color="var(--brand-blue)" />
            <h3 style={{ fontSize: 15 }}>Temperature Limits</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Permitted Band:</span>{" "}
              <strong style={{ color: "var(--brand-blue-deep)" }}>
                {shipment.temperatureLimits.minC}°C to {shipment.temperatureLimits.maxC}°C
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Specification Source:</span>{" "}
              <span>{shipment.temperatureLimits.source || "Configured spec"}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Assumption Type:</span>{" "}
              <span>{shipment.temperatureLimits.isDemoAssumption ? "Demo assumption" : "User-defined specification"}</span>
            </div>
            {shipment.temperatureLimits.notes && (
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Notes:</span>{" "}
                <span>{shipment.temperatureLimits.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Container & Cooling Assumptions */}
        <div className="cc-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Box size={17} color="var(--brand-blue)" />
            <h3 style={{ fontSize: 15 }}>Container Configuration</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Insulation:</span>{" "}
              <strong>{shipment.container.insulation}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Cooling Mechanism:</span>{" "}
              <strong>{shipment.container.coolingSystem}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Category:</span>{" "}
              <span>{shipment.category}</span>
            </div>
            {shipment.container.notes && (
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Notes:</span>{" "}
                <span>{shipment.container.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Status & Actions Strip */}
      <div className="cc-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>Route Evaluation Status</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {isAnalyzed
                ? `Simulated evaluation complete. Selected route: ${shipment.selectedRouteId === "route-b" ? "Route B" : "Route A"}.`
                : "Awaiting simulation execution. Generate route analysis to compare corridors."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              to={`/shipments/${shipment.id}/analysis`}
              className="cc-btn cc-btn-secondary"
            >
              <span>{isAnalyzed ? "View Route Comparison" : "Run Route Analysis"}</span>
            </Link>

            {isAnalyzed && (
              <Link
                to={`/shipments/${shipment.id}/scenarios`}
                className="cc-btn cc-btn-secondary"
              >
                <Sliders size={14} />
                <span>Test Scenarios</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="cc-card">
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Shipment Activity Log</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shipment.activity && shipment.activity.length > 0 ? (
            shipment.activity.map((act, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--surface-subtle)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <span>{act.text}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>{act.at?.replace("T", " ").slice(0, 16)}</span>
                  <span className="cc-badge cc-badge-draft">{act.provenance || "user-reported"}</span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No activity recorded yet.</div>
          )}
        </div>
      </div>

      {/* Assign Driver Modal (Demo Only) */}
      <Modal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        title="Assign Driver"
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
              Demo only: no driver system connected
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Driver telematics and dispatch interfaces are simulated in this workbench environment. External IoT driver assignment is decoupled from the route simulation model.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            onClick={() => setShowDriverModal(false)}
          >
            Acknowledge
          </button>
        </div>
      </Modal>
    </div>
  );
}
