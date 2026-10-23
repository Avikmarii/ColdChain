import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Navigation,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { getRoutesForPair } from "../data/demoRoutes";
import RecommendationPanel from "../components/analysis/RecommendationPanel";
import RiskBadge from "../components/common/RiskBadge";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import NotFound from "./NotFound";

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipmentById, dispatch, showToast } = useShipments();
  const shipment = getShipmentById(id);

  if (!shipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`We could not locate shipment record with ID "${id}".`}
      />
    );
  }

  // If shipment has not been analyzed yet
  if (!shipment.analysis) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        <ProvenanceBanner text="Demo simulation: illustrative results only." />
        <div style={{ marginBottom: 20 }}>
          <Link to="/" className="cc-btn cc-btn-ghost cc-btn-sm" style={{ marginBottom: 8, paddingLeft: 0, display: "inline-flex" }}>
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <h1>Recommendation: {shipment.name}</h1>
        </div>
        <div className="cc-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <AlertTriangle size={32} color="var(--warning)" style={{ margin: "0 auto" }} />
          <h3 style={{ marginTop: 14 }}>Simulation Not Yet Evaluated</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, maxWidth: 440, margin: "6px auto 18px", fontSize: 14 }}>
            This shipment draft has not yet evaluated candidate routes. Run the demo analysis to review simulated temperature trends.
          </p>
          <Link to={`/shipments/${shipment.id}/analysis`} className="cc-btn cc-btn-primary">
            <Play size={15} />
            <span>Open Route Analysis</span>
          </Link>
        </div>
      </div>
    );
  }

  const routes = getRoutesForPair(shipment.origin, shipment.destination);
  const routeA = routes.find((r) => r.id === "route-a");
  const routeB = routes.find((r) => r.id === "route-b");

  const resA = shipment.analysis["route-a"];
  const resB = shipment.analysis["route-b"];
  const ranking = shipment.analysis.ranking;
  const preferredRouteId = ranking.preferredRouteId;

  const handleSaveToHistory = () => {
    const updated = {
      ...shipment,
      status: preferredRouteId ? "Recommended" : "No Feasible Route",
      selectedRouteId: preferredRouteId || shipment.selectedRouteId,
      activity: [
        ...(shipment.activity || []),
        {
          at: new Date().toISOString(),
          text: "Results confirmed and saved to history log",
          provenance: "demo-simulated"
        }
      ],
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: "UPDATE_SHIPMENT", payload: updated });
    showToast(
      "Saved to History",
      `Shipment ${shipment.id} analysis recorded in history repository`,
      "success"
    );
    navigate("/history");
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Not connected to live physical sensor telemetry." />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24
        }}
      >
        <div>
          <Link
            to={`/shipments/${shipment.id}/analysis`}
            className="cc-btn cc-btn-ghost cc-btn-sm"
            style={{ marginBottom: 6, paddingLeft: 0, display: "inline-flex" }}
          >
            <ArrowLeft size={14} />
            <span>Back to Route Comparison</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1>Analysis Results: {shipment.name}</h1>
            <CopyId id={shipment.id} />
            <StatusBadge status={shipment.status} />
          </div>

          <p style={{ marginTop: 4, fontSize: 14 }}>
            Corridor: <strong>{shipment.origin} → {shipment.destination}</strong> • Required Range: {shipment.temperatureLimits.minC}°C to {shipment.temperatureLimits.maxC}°C
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            to={`/shipments/${shipment.id}/scenarios`}
            className="cc-btn cc-btn-secondary"
          >
            <Sliders size={15} />
            <span>Test What-If Scenarios</span>
          </Link>

          <button
            type="button"
            className="cc-btn cc-btn-primary"
            onClick={handleSaveToHistory}
          >
            <Save size={15} />
            <span>Save to History</span>
          </button>
        </div>
      </div>

      {/* Two Route Result Cards Side-by-Side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          marginBottom: 24
        }}
      >
        {/* Route A Card */}
        {routeA && resA && (
          <div
            className="cc-card"
            style={{
              borderColor: preferredRouteId === "route-a" ? "#3978F6" : "var(--border)",
              boxShadow: preferredRouteId === "route-a" ? "0 0 0 2px rgba(57, 120, 246, 0.25), var(--shadow-md)" : "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3978F6" }} />
                <h3 style={{ fontSize: 16 }}>{routeA.name}</h3>
              </div>
              <RiskBadge level={resA.riskLevel} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14, fontSize: 13 }}>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Distance:</span>{" "}
                <strong>{routeA.distanceKm} km</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Travel Time:</span>{" "}
                <strong>{Math.floor(routeA.estimatedTimeMin / 60)}h {routeA.estimatedTimeMin % 60}m</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Max Sim. Temp:</span>{" "}
                <strong style={{ color: resA.maxC > shipment.temperatureLimits.maxC ? "var(--danger)" : "var(--text-primary)" }}>
                  {resA.maxC.toFixed(1)}°C
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Min Sim. Temp:</span>{" "}
                <strong>{resA.minC.toFixed(1)}°C</strong>
              </div>
            </div>

            <div style={{ padding: "10px 12px", background: "var(--surface-subtle)", borderRadius: "var(--radius-sm)", marginBottom: 14, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Simulated Excursions:</span>
                <strong style={{ color: resA.excursions.length > 0 ? "var(--danger)" : "var(--success)" }}>
                  {resA.excursions.length === 0 ? "None" : `${resA.excursions.length} (${resA.minutesOutOfRange} min)`}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Constraint Status:</span>
                <strong style={{ color: resA.constraintStatus === "meets" ? "var(--success)" : "var(--danger)" }}>
                  {resA.constraintStatus === "meets" ? "Meets configured limits" : "Does not meet limit"}
                </strong>
              </div>
            </div>

            <Link
              to={`/shipments/${shipment.id}/analysis`}
              className="cc-btn cc-btn-secondary cc-btn-sm"
              style={{ width: "100%" }}
            >
              <span>View Temperature Graph</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}

        {/* Route B Card */}
        {routeB && resB && (
          <div
            className="cc-card"
            style={{
              borderColor: preferredRouteId === "route-b" ? "#22B8A7" : "var(--border)",
              boxShadow: preferredRouteId === "route-b" ? "0 0 0 2px rgba(34, 184, 167, 0.25), var(--shadow-md)" : "var(--shadow-sm)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22B8A7" }} />
                <h3 style={{ fontSize: 16 }}>{routeB.name}</h3>
              </div>
              <RiskBadge level={resB.riskLevel} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14, fontSize: 13 }}>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Distance:</span>{" "}
                <strong>{routeB.distanceKm} km</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Travel Time:</span>{" "}
                <strong>{Math.floor(routeB.estimatedTimeMin / 60)}h {routeB.estimatedTimeMin % 60}m</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Max Sim. Temp:</span>{" "}
                <strong style={{ color: resB.maxC > shipment.temperatureLimits.maxC ? "var(--danger)" : "var(--text-primary)" }}>
                  {resB.maxC.toFixed(1)}°C
                </strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Min Sim. Temp:</span>{" "}
                <strong>{resB.minC.toFixed(1)}°C</strong>
              </div>
            </div>

            <div style={{ padding: "10px 12px", background: "var(--surface-subtle)", borderRadius: "var(--radius-sm)", marginBottom: 14, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>Simulated Excursions:</span>
                <strong style={{ color: resB.excursions.length > 0 ? "var(--danger)" : "var(--success)" }}>
                  {resB.excursions.length === 0 ? "None" : `${resB.excursions.length} (${resB.minutesOutOfRange} min)`}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Constraint Status:</span>
                <strong style={{ color: resB.constraintStatus === "meets" ? "var(--success)" : "var(--danger)" }}>
                  {resB.constraintStatus === "meets" ? "Meets configured limits" : "Does not meet limit"}
                </strong>
              </div>
            </div>

            <Link
              to={`/shipments/${shipment.id}/analysis`}
              className="cc-btn cc-btn-secondary cc-btn-sm"
              style={{ width: "100%" }}
            >
              <span>View Temperature Graph</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Recommendation Panel */}
      <RecommendationPanel
        ranking={ranking}
        routes={routes}
        analysisResults={shipment.analysis}
      />
    </div>
  );
}
