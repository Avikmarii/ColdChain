// Precomputed simplified polylines (illustrative route geometry, static data)
// Never draw a straight line; all routes trace realistic highway waypoints.

export const ROUTE_GEOMETRY = {
  "Bengaluru-Mysuru": {
    originCoords: [12.9716, 77.5946],
    originName: "Bengaluru",
    destinationCoords: [12.2958, 76.6394],
    destinationName: "Mysuru",
    center: [12.63, 77.1],
    zoom: 9,
    routes: {
      "route-a": {
        id: "route-a",
        name: "Route A (Expressway)",
        tag: "Faster",
        distanceKm: 145,
        estimatedTimeMin: 180, // 3h 0m
        coordinates: [
          [12.9716, 77.5946], [12.9248, 77.5023], [12.8711, 77.4432], [12.8123, 77.4011],
          [12.7541, 77.3488], [12.7205, 77.2831], [12.6512, 77.2078], [12.6021, 77.1654],
          [12.5789, 77.1211], [12.5512, 77.0654], [12.5189, 76.9987], [12.5021, 76.9453],
          [12.4812, 76.8912], [12.4387, 76.8321], [12.4215, 76.7723], [12.3912, 76.7214],
          [12.3587, 76.6891], [12.3211, 76.6623], [12.2958, 76.6394]
        ]
      },
      "route-b": {
        id: "route-b",
        name: "Route B (Kanakapura Road)",
        tag: "Alternative",
        distanceKm: 165,
        estimatedTimeMin: 200, // 3h 20m
        coordinates: [
          [12.9716, 77.5946], [12.8832, 77.5741], [12.8021, 77.5512], [12.7214, 77.5142],
          [12.6412, 77.4687], [12.5541, 77.4211], [12.4789, 77.3712], [12.3954, 77.3012],
          [12.3412, 77.2145], [12.2891, 77.1204], [12.2612, 77.0412], [12.2412, 76.9512],
          [12.2354, 76.8712], [12.2487, 76.7912], [12.2712, 76.7211], [12.2958, 76.6394]
        ]
      }
    }
  },
  "Bengaluru-Chennai": {
    originCoords: [12.9716, 77.5946],
    originName: "Bengaluru",
    destinationCoords: [13.0827, 80.2707],
    destinationName: "Chennai",
    center: [12.95, 78.9],
    zoom: 8,
    routes: {
      "route-a": {
        id: "route-a",
        name: "Route A (via Hosur & Krishnagiri)",
        tag: "National Highway",
        distanceKm: 345,
        estimatedTimeMin: 390,
        coordinates: [
          [12.9716, 77.5946], [12.7409, 77.8253], [12.5186, 78.2137], [12.6312, 78.5874],
          [12.7904, 78.7166], [12.9165, 79.1325], [12.9345, 79.4321], [12.9641, 79.7912],
          [13.0012, 80.0512], [13.0827, 80.2707]
        ]
      },
      "route-b": {
        id: "route-b",
        name: "Route B (via Kolar & Chittoor)",
        tag: "Northern Corridor",
        distanceKm: 330,
        estimatedTimeMin: 410,
        coordinates: [
          [12.9716, 77.5946], [13.0812, 77.7812], [13.1362, 78.1291], [13.1891, 78.5211],
          [13.2172, 79.1003], [13.0912, 79.4512], [13.0412, 79.8512], [13.0827, 80.2707]
        ]
      }
    }
  },
  "Bengaluru-Hyderabad": {
    originCoords: [12.9716, 77.5946],
    originName: "Bengaluru",
    destinationCoords: [17.3850, 78.4867],
    destinationName: "Hyderabad",
    center: [15.2, 77.9],
    zoom: 7,
    routes: {
      "route-a": {
        id: "route-a",
        name: "Route A (NH44 Express)",
        tag: "Primary Highway",
        distanceKm: 570,
        estimatedTimeMin: 540,
        coordinates: [
          [12.9716, 77.5946], [13.3121, 77.7121], [13.8211, 77.7512], [14.6819, 77.6006],
          [15.1789, 77.6412], [15.8281, 78.0373], [16.5412, 78.1211], [17.1512, 78.3412],
          [17.3850, 78.4867]
        ]
      },
      "route-b": {
        id: "route-b",
        name: "Route B (State Corridor)",
        tag: "Alternative",
        distanceKm: 595,
        estimatedTimeMin: 580,
        coordinates: [
          [12.9716, 77.5946], [13.2512, 77.5412], [13.8112, 77.4912], [14.4112, 77.7112],
          [15.1212, 77.8912], [15.8281, 78.0373], [16.7112, 78.2112], [17.3850, 78.4867]
        ]
      }
    }
  },
  "Bengaluru-Pune": {
    originCoords: [12.9716, 77.5946],
    originName: "Bengaluru",
    destinationCoords: [18.5204, 73.8567],
    destinationName: "Pune",
    center: [15.8, 75.8],
    zoom: 6,
    routes: {
      "route-a": {
        id: "route-a",
        name: "Route A (NH48 Golden Quadrilateral)",
        tag: "Express Corridor",
        distanceKm: 840,
        estimatedTimeMin: 810,
        coordinates: [
          [12.9716, 77.5946], [13.3422, 77.1017], [14.2251, 76.3980], [14.4644, 75.9218],
          [15.3647, 75.1240], [15.8497, 74.4977], [16.7050, 74.2433], [17.6805, 74.0183],
          [18.5204, 73.8567]
        ]
      },
      "route-b": {
        id: "route-b",
        name: "Route B (Western Ghats Bypass)",
        tag: "Bypass",
        distanceKm: 890,
        estimatedTimeMin: 900,
        coordinates: [
          [12.9716, 77.5946], [13.3121, 76.5412], [13.9298, 75.5681], [14.8123, 74.9123],
          [15.4121, 74.6121], [16.7050, 74.2433], [17.6805, 74.0183], [18.5204, 73.8567]
        ]
      }
    }
  },
  "Delhi-Jaipur": {
    originCoords: [28.6139, 77.2090],
    originName: "Delhi",
    destinationCoords: [26.9124, 75.7873],
    destinationName: "Jaipur",
    center: [27.7, 76.5],
    zoom: 8,
    routes: {
      "route-a": {
        id: "route-a",
        name: "Route A (Expressway via Dausa)",
        tag: "Speed Link",
        distanceKm: 270,
        estimatedTimeMin: 220,
        coordinates: [
          [28.6139, 77.2090], [28.3512, 77.0512], [28.1812, 77.0112], [27.8123, 76.8123],
          [27.3121, 76.6123], [26.8921, 76.3321], [26.9124, 75.7873]
        ]
      },
      "route-b": {
        id: "route-b",
        name: "Route B (NH48 via Behror)",
        tag: "Traditional Highway",
        distanceKm: 280,
        estimatedTimeMin: 270,
        coordinates: [
          [28.6139, 77.2090], [28.4595, 77.0266], [28.1989, 76.6178], [27.8921, 76.2812],
          [27.5123, 76.0121], [27.1512, 75.9012], [26.9124, 75.7873]
        ]
      }
    }
  }
};

export const DEMO_CITIES = [
  "Bengaluru",
  "Mysuru",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Delhi",
  "Jaipur"
];

export const VALID_CITY_PAIRS = [
  { origin: "Bengaluru", destination: "Mysuru" },
  { origin: "Bengaluru", destination: "Chennai" },
  { origin: "Bengaluru", destination: "Hyderabad" },
  { origin: "Bengaluru", destination: "Pune" },
  { origin: "Delhi", destination: "Jaipur" }
];

export function getRoutePairGeometry(origin, destination) {
  const key = `${origin}-${destination}`;
  return ROUTE_GEOMETRY[key] || null;
}
