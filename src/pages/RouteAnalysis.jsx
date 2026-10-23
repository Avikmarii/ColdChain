import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Edit,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { getRoutesForPair } from "../data/demoRoutes";
import { api } from "../services/api";
import RouteMap from "../components/analysis/RouteMap";
import RouteCard from "../components/analysis/RouteCard";
import TemperatureChart from "../components/analysis/TemperatureChart";
import AnalysisSummary from "../components/analysis/AnalysisSummary";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import AttentiveFace from "../components/common/AttentiveFace";
import NotFound from "./NotFound";

export default function RouteAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipmentById, dispatch, showToast } = useShipments();
  const shipment = getShipmentById(id);

  const [selectedRouteId, setSelectedRouteId] = useState("route-a");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!shipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`We could not locate shipment record with ID "${id}".`}
      />
    );
  }

  const routes = getRoutesForPair(shipment.origin, shipment.destination);
  const routeA = routes.find((r) => r.id === "route-a");
  const routeB = routes.find((r) => r.id === "route-b");

  const isAnalyzed = Boolean(shipment.analysis);
  const activeAnalysis = shipment.analysis ? shipment.analysis[selectedRouteId] : null;
  const preferredRouteId = shipment.analysis?.ranking?.preferredRouteId || null;

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.runAnalysis(shipment.id);
      const updatedShipment = res.data;

      dispatch({ type: "UPSERT_LOCAL_SHIPMENT", payload: updatedShipment });
      setIsLoading(false);

      if (updatedShipment.analysis?.ranking?.preferredRouteId) {
        setSelectedRouteId(updatedShipment.analysis.ranking.preferredRouteId);
      }

      showToast(
        "Analysis completed",
        `Evaluated ${routes.length} candidate corridors under model assumptions.`,
        "success"
      );
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Simulation engine encountered an evaluation error. Please retry.");
    }
  };

  return (
    <div>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Not connected to live telemetry or physical sensors." />

      {/* Header Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20
        }}
      >
        <div>
          <Link
            to="/"
            className="cc-btn cc-btn-ghost cc-btn-sm"
            style={{ marginBottom: 6, paddingLeft: 0, display: "inline-flex" }}
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1>Route Comparison: {shipment.name}</h1>
            <CopyId id={shipment.id} />
            <StatusBadge status={shipment.status} />
          </div>

          <p style={{ marginTop: 4, fontSize: 14 }}>
            Corridor: <strong>{shipment.origin} → {shipment.destination}</strong> • Band: {shipment.temperatureLimits.minC}°C to {shipment.temperatureLimits.maxC}°C
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link
            to={`/shipments/${shipment.id}/edit`}
            className="cc-btn cc-btn-secondary"
          >
            <Edit size={15} />
            <span>Edit Shipment</span>
          </Link>

          <button
            type="button"
            className="cc-btn cc-btn-primary cc-btn-lg"
            onClick={handleRunAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Run Demo Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
            <div className="cc-skeleton" style={{ height: 390 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="cc-skeleton" style={{ height: 185 }} />
              <div className="cc-skeleton" style={{ height: 185 }} />
            </div>
          </div>
          <div className="cc-skeleton" style={{ height: 300 }} />
        </div>
      ) : error ? (
        <div
          className="cc-card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <AttentiveFace width={140} height={170} />
          <h3 style={{ marginTop: 16, color: "var(--danger)" }}>Simulation Interrupted</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: 6, maxWidth: 400, fontSize: 14 }}>
            {error}
          </p>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            onClick={handleRunAnalysis}
            style={{ marginTop: 16 }}
          >
            <RefreshCw size={15} />
            <span>Retry Simulation</span>
          </button>
        </div>
      ) : (
        <>
          {/* Main 2-Column Grid: Map (60%) + Cards (40%) */}
          <div className="cc-analysis-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Map on Left */}
            <div>
              <RouteMap
                origin={shipment.origin}
                destination={shipment.destination}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(routeId) => setSelectedRouteId(routeId)}
              />
            </div>

            {/* Stacked Route Cards on Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {routeA && (
                <RouteCard
                  route={routeA}
                  analysisResult={shipment.analysis ? shipment.analysis["route-a"] : null}
                  isSelected={selectedRouteId === "route-a"}
                  onSelect={() => setSelectedRouteId("route-a")}
                  isPreferred={preferredRouteId === "route-a"}
                />
              )}

              {routeB && (
                <RouteCard
                  route={routeB}
                  analysisResult={shipment.analysis ? shipment.analysis["route-b"] : null}
                  isSelected={selectedRouteId === "route-b"}
                  onSelect={() => setSelectedRouteId("route-b")}
                  isPreferred={preferredRouteId === "route-b"}
                />
              )}
            </div>
          </div>

          {/* Full Width Simulated Temperature Chart */}
          <TemperatureChart
            analysisResult={activeAnalysis}
            routeName={selectedRouteId === "route-a" ? routeA?.name : routeB?.name}
            limits={shipment.temperatureLimits}
          />

          {/* Summary Row */}
          <AnalysisSummary analysisResult={activeAnalysis} />

          {/* Next Steps Strip */}
          {isAnalyzed && (
            <div
              style={{
                marginTop: 24,
                padding: "16px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Analysis evaluated under current model assumptions.
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                  Review side-by-side trade-offs, constraints, and the explainable recommendation breakdown.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  to={`/shipments/${shipment.id}/scenarios`}
                  className="cc-btn cc-btn-secondary"
                >
                  <span>Test What-If Scenarios</span>
                </Link>

                <Link
                  to={`/shipments/${shipment.id}/results`}
                  className="cc-btn cc-btn-primary"
                >
                  <span>View Detailed Results</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
