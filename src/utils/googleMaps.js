/**
 * Google Maps Universal Navigation Utility
 * Generates turn-by-turn navigation URLs matching Google Maps specifications
 * Grounds Bangalore cold-chain corridor from route breakdown:
 * Gopalan College -> Marathahalli -> Eco Space Bellandur -> Central Silk Board
 */

export const FLAGSHIP_BANGALORE_ROUTE = {
  origin: "Gopalan College of Engineering and Management, Seetharampalya, Hoodi Road, Bengaluru",
  destination: "Member Secy Central Silk Board, Hosur Road, BTM Layout, Bengaluru",
  waypoints: [
    "Marathahalli, Bengaluru, Karnataka",
    "Eco Space Business Park, Bellandur, Bengaluru, Karnataka"
  ],
  distanceKm: 19.8,
  estimatedTimeMin: 44,
  label: "East-to-South Cold-Chain Radial Corridor (ORR)"
};

/**
 * Builds standard Google Maps directions universal URL
 */
export function buildGoogleMapsUrl({ origin, destination, waypoints = [] } = {}) {
  const o = origin || FLAGSHIP_BANGALORE_ROUTE.origin;
  const d = destination || FLAGSHIP_BANGALORE_ROUTE.destination;
  const wp = Array.isArray(waypoints) && waypoints.length > 0
    ? waypoints
    : FLAGSHIP_BANGALORE_ROUTE.waypoints;

  const params = new URLSearchParams({
    api: "1",
    origin: o,
    destination: d,
    travelmode: "driving"
  });

  if (wp.length > 0) {
    params.set("waypoints", wp.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Builds navigation URL specifically for a given shipment
 */
export function getShipmentGoogleMapsUrl(shipment) {
  if (!shipment) {
    return buildGoogleMapsUrl();
  }

  // If shipment has specific stops or route
  let origin = shipment.origin;
  let destination = shipment.destination;
  let waypoints = [];

  // If shipment is Bengaluku to Mysuru or Chennai, add region disambiguation if needed
  if (origin && !origin.toLowerCase().includes("karnataka") && !origin.toLowerCase().includes("india")) {
    origin = `${origin}, Karnataka, India`;
  }
  if (destination && !destination.toLowerCase().includes("karnataka") && !destination.toLowerCase().includes("india")) {
    destination = `${destination}, India`;
  }

  // If the shipment matches the Bangalore corridor or default demo
  if (shipment.id === "CC-001" || (!shipment.origin && !shipment.destination)) {
    return buildGoogleMapsUrl(FLAGSHIP_BANGALORE_ROUTE);
  }

  return buildGoogleMapsUrl({ origin, destination, waypoints });
}

/**
 * Direct navigation handler that opens Google Maps in a new tab
 */
export function openInGoogleMaps(shipment = null) {
  const url = getShipmentGoogleMapsUrl(shipment);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}
