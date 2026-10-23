/**
 * Route Scorer & Ranker
 * Evaluates candidate route results against shipment constraints.
 * Strict non-negotiables: Never claims "safe" or "approved".
 * Uses honest hedged language: "meets configured limits in this simulation"
 * and "preferred under current assumptions".
 */

export function rankRoutes(results, constraints = {}) {
  if (!results || results.length === 0) {
    return {
      preferredRouteId: null,
      reasons: [],
      tradeoffs: [],
      limitations: ["No candidate routes evaluated."]
    };
  }

  // Filter routes that meet configured constraints in this simulation
  const compliantRoutes = results.filter((r) => r.constraintStatus === "meets");

  // If no routes meet constraints:
  if (compliantRoutes.length === 0) {
    return {
      preferredRouteId: null,
      reasons: [],
      tradeoffs: [],
      limitations: [
        "No feasible route found under current assumptions.",
        "All candidate routes exhibited simulated temperature excursions beyond configured tolerances.",
        "Consider enhancing container insulation or selecting active refrigerated transport."
      ]
    };
  }

  // If compliant routes exist: sort by lowest peak temperature and risk level
  const sorted = [...compliantRoutes].sort((a, b) => {
    if (a.riskLevel === "low" && b.riskLevel !== "low") return -1;
    if (b.riskLevel === "low" && a.riskLevel !== "low") return 1;
    return a.maxC - b.maxC;
  });

  const preferred = sorted[0];
  const otherRoute = results.find((r) => r.routeId !== preferred.routeId);

  const reasons = [
    "Meets configured limits in this simulation",
    preferred.excursions.length === 0
      ? "No simulated temperature excursions detected"
      : `${preferred.minutesOutOfRange} min total excursion duration`,
    `Lower simulated thermal risk (${preferred.riskLevel} risk)`
  ];

  const tradeoffs = [];
  if (otherRoute) {
    const timeDiffMin = preferred.travelTimeMin - otherRoute.travelTimeMin;
    if (timeDiffMin > 0) {
      tradeoffs.push(`${timeDiffMin} minutes longer transit time than ${otherRoute.routeId === "route-a" ? "Route A" : "Route B"}`);
    }
  }

  const limitations = [
    "Demo simulation model (demo-0.1, illustrative results only)",
    "Assumes constant ambient temperature without real-time microclimate adjustments",
    "No live GPS or active telemetry sensor verification"
  ];

  return {
    preferredRouteId: preferred.routeId,
    reasons,
    tradeoffs,
    limitations
  };
}
