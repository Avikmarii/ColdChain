import { calculateThermalSeries } from "./thermalModel";
import { detectExcursions } from "./excursionDetector";
import { rankRoutes } from "./routeScorer";
import { runScenarioSimulation } from "./scenarioEngine";
import { getRoutesForPair } from "../data/demoRoutes";

export function analyzeRoute({
  shipment,
  route,
  scenario = {}
}: {
  shipment: any;
  route: any;
  scenario?: any;
}) {
  const limits = shipment.temperatureLimits || { minC: 2.0, maxC: 8.0 };
  const extraDelayMin = Number(scenario.extraDelayMin || 0);
  const ambientC = Number(scenario.ambientC || 32);
  const coolingInterruptionMin = scenario.isInterrupted ? Number(scenario.coolingInterruptionMin || 0) : 0;
  const insulation = scenario.insulationPreset || shipment.container?.insulation || "Moderate";
  const coolingSystem = shipment.container?.coolingSystem || "Active (Refrigerated)";

  const series = calculateThermalSeries({
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

  const metrics = detectExcursions(series, limits);

  return {
    routeId: route.id,
    scenario: {
      extraDelayMin,
      ambientC,
      coolingInterruptionMin
    },
    travelTimeMin: route.estimatedTimeMin + extraDelayMin,
    series,
    limits,
    ...metrics,
    provenance: "demo-simulated",
    modelVersion: "demo-0.1"
  };
}

export function analyzeShipmentRoutes(shipment: any) {
  const routes = getRoutesForPair(shipment.origin, shipment.destination);
  if (!routes || routes.length === 0) {
    throw new Error(`No route corridors available for ${shipment.origin} to ${shipment.destination}`);
  }

  const results: Record<string, any> = {};
  const resultsList: any[] = [];

  routes.forEach((route) => {
    const analysis = analyzeRoute({ shipment, route });
    results[route.id] = analysis;
    resultsList.push(analysis);
  });

  const ranking = rankRoutes(resultsList, {
    maxTransitHours: shipment.maxTransitHours,
    limits: shipment.temperatureLimits
  });

  return {
    ...results,
    ranking
  };
}

export {
  calculateThermalSeries,
  detectExcursions,
  rankRoutes,
  runScenarioSimulation
};
