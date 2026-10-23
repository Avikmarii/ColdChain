import { analyzeRoute, analyzeShipmentRoutes, runScenarioSimulation } from "./index";
import { SEED_SHIPMENTS } from "../data/demoShipments";
import { getRoutesForPair } from "../data/demoRoutes";

export function testGoldenPath() {
  const cc001 = SEED_SHIPMENTS.find((s) => s.id === "CC-001");
  const routes = getRoutesForPair(cc001.origin, cc001.destination);
  const routeA = routes.find((r) => r.id === "route-a");
  const routeB = routes.find((r) => r.id === "route-b");

  const resA = analyzeRoute({ shipment: cc001, route: routeA });
  const resB = analyzeRoute({ shipment: cc001, route: routeB });

  console.log("=== Golden Path Verification ===");
  console.log("Route A:", {
    maxC: resA.maxC,
    minC: resA.minC,
    excursions: resA.excursions.length,
    minutesOutOfRange: resA.minutesOutOfRange,
    riskLevel: resA.riskLevel,
    constraintStatus: resA.constraintStatus
  });

  console.log("Route B:", {
    maxC: resB.maxC,
    minC: resB.minC,
    excursions: resB.excursions.length,
    minutesOutOfRange: resB.minutesOutOfRange,
    riskLevel: resB.riskLevel,
    constraintStatus: resB.constraintStatus
  });

  const all = analyzeShipmentRoutes(cc001);
  console.log("Ranking preferred route:", all.ranking.preferredRouteId);
  console.log("Ranking reasons:", all.ranking.reasons);
  console.log("Ranking tradeoffs:", all.ranking.tradeoffs);

  // Scenario test fixture
  const scenario = runScenarioSimulation({
    shipment: cc001,
    route: routeA,
    scenario: {
      extraDelayMin: 30,
      ambientC: 35,
      isInterrupted: true,
      coolingInterruptionMin: 45
    }
  });

  console.log("Scenario Route A Modified:", {
    travelTimeMin: scenario.modified.travelTimeMin,
    maxC: scenario.modified.maxC,
    minutesOutOfRange: scenario.modified.minutesOutOfRange,
    constraintStatus: scenario.modified.constraintStatus
  });

  // Asserts
  const passA = Math.abs(resA.maxC - 9.1) <= 0.1 && resA.minutesOutOfRange === 15 && resA.constraintStatus === "fails";
  const passB = Math.abs(resB.maxC - 6.2) <= 0.1 && resB.minutesOutOfRange === 0 && resB.constraintStatus === "meets";
  const passRank = all.ranking.preferredRouteId === "route-b";
  const passScenario = Math.abs(scenario.modified.maxC - 10.5) <= 0.1 && Math.abs(scenario.modified.minutesOutOfRange - 25) <= 1;

  console.log("Pass assertions:", { passA, passB, passRank, passScenario });
  return passA && passB && passRank && passScenario;
}
