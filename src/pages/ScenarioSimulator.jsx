import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { getRoutesForPair } from "../data/demoRoutes";
import { api } from "../services/api";
import ScenarioControls from "../components/scenarios/ScenarioControls";
import ScenarioComparison from "../components/scenarios/ScenarioComparison";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import AttentiveFace from "../components/common/AttentiveFace";
import NotFound from "./NotFound";

export default function ScenarioSimulator() {
  const { id } = useParams();
  const { getShipmentById, showToast } = useShipments();
  const shipment = getShipmentById(id);

  if (!shipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`We could not locate shipment record with ID "${id}".`}
      />
    );
  }

  const routes = getRoutesForPair(shipment.origin, shipment.destination);
  const [selectedRouteId, setSelectedRouteId] = useState("route-a");

  // Initial scenario setup: calibrated with default scenario parameters
  const [scenario, setScenario] = useState({
    extraDelayMin: 30,
    ambientC: 35,
    isInterrupted: true,
    coolingInterruptionMin: 45,
    insulationPreset: shipment.container?.insulation || "Moderate"
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const runSimulation = useCallback(async (inputs, routeId) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.runScenario(shipment.id, {
        routeId: routeId || selectedRouteId,
        extraDelayMin: inputs.extraDelayMin,
        ambientC: inputs.ambientC,
        isInterrupted: inputs.isInterrupted,
        coolingInterruptionMin: inputs.coolingInterruptionMin,
        insulationPreset: inputs.insulationPreset
      });

      if (res.data) {
        setSimulationResult({
          baseline: res.data.baseline,
          modified: res.data.modified,
          explanation: res.data.explanation
        });
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Failed to execute scenario simulation on backend.");
    }
  }, [shipment.id, selectedRouteId]);

  // Run on mount or when route changes
  useEffect(() => {
    runSimulation(scenario, selectedRouteId);
  }, [selectedRouteId]);

  // Debounced run when controls change
  const debounceTimerRef = useRef(null);
  const handleScenarioChange = (field, value) => {
    const nextScenario = { ...scenario, [field]: value };
    setScenario(nextScenario);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSimulation(nextScenario, selectedRouteId);
    }, 400);
  };

  const handleReset = () => {
    const resetScenario = {
      extraDelayMin: 0,
      ambientC: 32,
      isInterrupted: false,
      coolingInterruptionMin: 0,
      insulationPreset: shipment.container?.insulation || "Moderate"
    };
    setScenario(resetScenario);
    runSimulation(resetScenario, selectedRouteId);
    showToast("Scenario Reset", "Restored standard baseline model assumptions", "info");
  };

  const handleRun = () => {
    runSimulation(scenario, selectedRouteId);
    showToast(
      "Scenario Simulated",
      `Evaluated ${selectedRoute.name} with ${scenario.extraDelayMin}m delay and ${scenario.ambientC}°C ambient.`,
      "info"
    );
  };

  return (
    <div>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Not connected to live physical sensor telemetry." />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to={`/shipments/${shipment.id}/analysis`}
          className="cc-btn cc-btn-ghost cc-btn-sm"
          style={{ marginBottom: 6, paddingLeft: 0, display: "inline-flex" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Route Comparison</span>
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1>What-If Scenario Simulator: {shipment.name}</h1>
              <CopyId id={shipment.id} />
              <StatusBadge status={shipment.status} />
            </div>
            <p style={{ marginTop: 4, fontSize: 14 }}>
              Simulate traffic disruptions, seasonal heat waves, or refrigeration compressor cut-offs.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              to={`/shipments/${shipment.id}/results`}
              className="cc-btn cc-btn-secondary"
            >
              <span>View Recommendation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout on Desktop, stacked on Mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
          alignItems: "start"
        }}
      >
        {/* Left Column: Controls */}
        <ScenarioControls
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
          scenario={scenario}
          onScenarioChange={handleScenarioChange}
          onReset={handleReset}
          onRun={handleRun}
        />

        {/* Right Column: Comparison Results */}
        {isLoading && !simulationResult ? (
          <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="cc-skeleton" style={{ height: 120 }} />
            <div className="cc-skeleton" style={{ height: 320 }} />
          </div>
        ) : error && !simulationResult ? (
          <div
            className="cc-card"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <AttentiveFace width={120} height={150} />
            <h3 style={{ marginTop: 14, color: "var(--danger)" }}>Simulation Failed</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 13, maxWidth: 360 }}>
              {error}
            </p>
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              onClick={() => runSimulation(scenario, selectedRouteId)}
              style={{ marginTop: 14 }}
            >
              <RefreshCw size={14} />
              <span>Retry Scenario</span>
            </button>
          </div>
        ) : simulationResult ? (
          <div style={{ position: "relative" }}>
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  background: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <RefreshCw size={12} className="animate-spin" />
                <span>Simulating...</span>
              </div>
            )}
            <ScenarioComparison
              baselineResult={simulationResult.baseline}
              modifiedResult={simulationResult.modified}
              explanation={simulationResult.explanation}
              limits={shipment.temperatureLimits}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
