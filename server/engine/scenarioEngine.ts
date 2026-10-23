import { calculateThermalSeries } from "./thermalModel";
import { detectExcursions } from "./excursionDetector";

/**
 * Server Scenario Engine
 * Evaluates What-If variations against baseline.
 */

export function runScenarioSimulation({
  shipment,
  route,
  scenario = {}
}: {
  shipment: any;
  route: any;
  scenario?: any;
}) {
  const limits = shipment.temperatureLimits || { minC: 2.0, maxC: 8.0 };

  // 1. Baseline simulation (0 delay, standard ambient 32°C, active cooling, no interruption)
  const baselineSeries = calculateThermalSeries({
    travelTimeMin: route.estimatedTimeMin,
    extraDelayMin: 0,
    ambientC: 32,
    insulation: shipment.container?.insulation || "Moderate",
    coolingSystem: shipment.container?.coolingSystem || "Active (Refrigerated)",
    coolingInterruptionMin: 0,
    limits,
    routeId: route.id,
    shipmentId: shipment.id
  });

  const baselineMetrics = detectExcursions(baselineSeries, limits);

  const baselineResult = {
    routeId: route.id,
    scenario: { extraDelayMin: 0, ambientC: 32, coolingInterruptionMin: 0 },
    travelTimeMin: route.estimatedTimeMin,
    series: baselineSeries,
    limits,
    ...baselineMetrics,
    provenance: "demo-simulated",
    modelVersion: "demo-0.1"
  };

  // 2. Modified scenario simulation
  const extraDelayMin = Number(scenario.extraDelayMin || 0);
  const ambientC = Number(scenario.ambientC || 32);
  const coolingInterruptionMin = scenario.isInterrupted ? Number(scenario.coolingInterruptionMin || 0) : 0;
  const insulation = scenario.insulationPreset || shipment.container?.insulation || "Moderate";
  const coolingSystem = shipment.container?.coolingSystem || "Active (Refrigerated)";

  const modifiedSeries = calculateThermalSeries({
    travelTimeMin: route.estimatedTimeMin,
    extraDelayMin,
    ambientC,
    insulation,
    coolingSystem,
    coolingInterruptionMin,
    limits,
    routeId: route.id,
    shipmentId: shipment.id
  });

  const modifiedMetrics = detectExcursions(modifiedSeries, limits);

  const modifiedResult = {
    routeId: route.id,
    scenario: {
      extraDelayMin,
      ambientC,
      coolingInterruptionMin,
      insulationPreset: insulation
    },
    travelTimeMin: route.estimatedTimeMin + extraDelayMin,
    series: modifiedSeries,
    limits,
    ...modifiedMetrics,
    provenance: "demo-simulated",
    modelVersion: "demo-0.1"
  };

  let explanation = "Under these simulated model assumptions, thermal behaviour remains within configured tolerances.";
  if (modifiedMetrics.constraintStatus === "fails") {
    explanation = `Under these simulated assumptions, an additional ${extraDelayMin}m delay and ${ambientC}°C ambient conditions elevate the peak temperature to ${modifiedResult.maxC}°C, resulting in approximately ${modifiedResult.minutesOutOfRange} minutes outside permitted limits.`;
  } else if (modifiedResult.maxC > baselineResult.maxC) {
    explanation = `Under these simulated model assumptions, peak internal temperature increases by ${(modifiedResult.maxC - baselineResult.maxC).toFixed(1)}°C, but remains within configured specifications.`;
  }

  return {
    baseline: baselineResult,
    modified: modifiedResult,
    explanation
  };
}
