import { analyzeRoute, analyzeShipmentRoutes, runScenarioSimulation, rankRoutes } from "./index";
import { SEED_SHIPMENTS } from "../data/demoShipments";
import { getRoutesForPair } from "../data/demoRoutes";
import { parseAndValidateCsv } from "../utils/importCsv";

export function runFullVerificationSuite() {
  const results = [];

  // 1. Golden Path Test (CC-001)
  const cc001 = SEED_SHIPMENTS.find((s) => s.id === "CC-001");
  const routes001 = getRoutesForPair(cc001.origin, cc001.destination);
  const routeA = routes001.find((r) => r.id === "route-a");
  const routeB = routes001.find((r) => r.id === "route-b");

  const resA = analyzeRoute({ shipment: cc001, route: routeA });
  const resB = analyzeRoute({ shipment: cc001, route: routeB });
  const analysisAll = analyzeShipmentRoutes(cc001);

  const test1 =
    Math.abs(resA.maxC - 9.1) <= 0.1 &&
    resA.minutesOutOfRange === 15 &&
    resA.constraintStatus === "fails" &&
    Math.abs(resB.maxC - 6.2) <= 0.1 &&
    resB.minutesOutOfRange === 0 &&
    resB.constraintStatus === "meets" &&
    analysisAll.ranking.preferredRouteId === "route-b";

  results.push({ name: "Golden Path CC-001 (9.1°C vs 6.2°C, Route B preferred)", passed: test1 });

  // 2. Scenario Fixture Test
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

  const test2 =
    scenario.baseline.maxC === resA.maxC && // Baseline matches analysis output!
    Math.abs(scenario.modified.maxC - 10.5) <= 0.1 &&
    scenario.modified.minutesOutOfRange === 25;

  results.push({ name: "Scenario Fixture (Baseline matches analysis, Modified is 10.5°C & 25m)", passed: test2 });

  // 3. Scorer returns null when all routes fail (CC-004 seeded case)
  const cc004 = SEED_SHIPMENTS.find((s) => s.id === "CC-004");
  const analysis004 = analyzeShipmentRoutes(cc004);
  const test3 = analysis004.ranking.preferredRouteId === null;
  results.push({ name: "Scorer returns null when all routes fail (CC-004)", passed: test3 });

  // 4. CSV Import: Missing column rejected
  const badCsvMissingCol = "id,name,route\nCC-999,Test,Bengaluru to Mysuru";
  const importMissing = parseAndValidateCsv(badCsvMissingCol);
  const test4 = Boolean(importMissing.error) && importMissing.error.includes("Missing required column");
  results.push({ name: "CSV Import: Missing required column rejected", passed: test4 });

  // 5. CSV Import: Duplicate ID skipped
  const duplicateCsv = "id,name,category,route,status,date\nCC-001,Duplicate Name,Vaccine,Bengaluru to Mysuru,Draft,2026-10-24T09:00";
  const existingSet = new Set(["CC-001"]);
  const importDup = parseAndValidateCsv(duplicateCsv, existingSet);
  const test5 =
    importDup.importedShipments.length === 0 &&
    importDup.skippedRows.length === 1 &&
    importDup.skippedRows[0].reason.includes("Duplicate");
  results.push({ name: "CSV Import: Duplicate ID skipped", passed: test5 });

  // 6. CSV Import: Valid file with quoted commas and formula injection prefix
  const validCsv = `id,name,category,route,status,date,provenance
'CC-901,"Special Lot, Batch 1",Vaccine,"Bengaluru to Mysuru",Draft,2026-10-24T09:00,user-configured`;
  const importValid = parseAndValidateCsv(validCsv, new Set());
  const test6 =
    importValid.importedShipments.length === 1 &&
    importValid.importedShipments[0].id === "CC-901" &&
    importValid.importedShipments[0].name === "Special Lot, Batch 1" &&
    importValid.importedShipments[0].source === "imported" &&
    importValid.importedShipments[0].analysis === null;
  results.push({ name: "CSV Import: Quotes, sanitized cells, and imported metadata", passed: test6 });

  // 7. CSV Import: Oversized file guard
  const giantCsv = "a".repeat(1024 * 1024 + 10);
  const importOversized = parseAndValidateCsv(giantCsv);
  const test7 = Boolean(importOversized.error) && importOversized.error.includes("1 MB");
  results.push({ name: "CSV Import: Oversized file rejected", passed: test7 });

  console.table(results);
  const allPassed = results.every((r) => r.passed);
  console.log("Overall Test Suite Result:", allPassed ? "ALL PASSED" : "FAILED");
  return allPassed;
}
