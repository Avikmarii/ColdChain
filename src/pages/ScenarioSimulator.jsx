import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sliders, Play, RotateCcw } from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { getRoutesForPair } from "../data/demoRoutes";
import { runScenarioSimulation } from "../engine";
import ScenarioControls from "../components/scenarios/ScenarioControls";
import ScenarioComparison from "../components/scenarios/ScenarioComparison";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
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

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  // Evaluate simulation instantly or on run
  const simulationResult = useMemo(() => {
    return runScenarioSimulation({
      shipment,
      route: selectedRoute,
      scenario
    });
  }, [shipment, selectedRoute, scenario]);

  const handleScenarioChange = (field, value) => {
    setScenario((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setScenario({
      extraDelayMin: 0,
      ambientC: 32,
      isInterrupted: false,
      coolingInterruptionMin: 0,
      insulationPreset: shipment.container?.insulation || "Moderate"
    });
    showToast("Scenario Reset", "Restored standard baseline model assumptions", "info");
  };

  const handleRun = () => {
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
        <ScenarioComparison
          baselineResult={simulationResult.baseline}
          modifiedResult={simulationResult.modified}
          explanation={simulationResult.explanation}
          limits={shipment.temperatureLimits}
        />
      </div>
    </div>
  );
}
