import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, AlertTriangle } from "lucide-react";
import { getRoutePairGeometry } from "../../data/routeGeometry";

// Accessible custom divIcons to prevent broken image assets under Vite
function createPinIcon(label, isOrigin = true) {
  const bgColor = isOrigin ? "#3978F6" : "#22B8A7";
  return L.divIcon({
    className: "cc-map-pin",
    html: `
      <div style="
        background: ${bgColor};
        color: #ffffff;
        font-weight: 700;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        border: 2px solid #ffffff;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
        transform: translate(-50%, -100%);
      ">
        <span>${label}</span>
      </div>
    `,
    iconSize: [0, 0]
  });
}

function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function RouteMap({
  origin,
  destination,
  selectedRouteId = "route-a",
  onSelectRoute
}) {
  const [tileError, setTileError] = useState(false);
  const pairData = getRoutePairGeometry(origin, destination);

  if (!pairData) {
    return (
      <div
        className="cc-card"
        style={{
          height: 380,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          textAlign: "center"
        }}
      >
        <AlertTriangle size={32} color="var(--warning)" />
        <h4 style={{ marginTop: 12 }}>No Route Map Available</h4>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
          No precomputed route geometry exists for {origin} → {destination}.
        </p>
      </div>
    );
  }

  const { originCoords, destinationCoords, center, zoom, routes } = pairData;
  const routeA = routes["route-a"];
  const routeB = routes["route-b"];

  return (
    <div
      style={{
        position: "relative",
        height: 390,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#E8EEF5"
      }}
    >
      {/* Offline tile fallback banner */}
      {tileError && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            padding: "4px 10px",
            borderRadius: 4,
            fontSize: 11,
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          Map tiles unavailable • Rendering offline vector geometry
        </div>
      )}

      {/* Caption overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.9)",
          padding: "4px 8px",
          borderRadius: 4,
          fontSize: 11,
          color: "var(--text-muted)",
          pointerEvents: "none",
          border: "1px solid rgba(0,0,0,0.05)"
        }}
      >
        Illustrative route geometry (demo data)
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <MapViewController center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true)
          }}
        />

        {/* Origin & Destination Markers */}
        <Marker
          position={originCoords}
          icon={createPinIcon(`Origin: ${origin}`, true)}
        >
          <Popup>Origin: {origin}</Popup>
        </Marker>

        <Marker
          position={destinationCoords}
          icon={createPinIcon(`Dest: ${destination}`, false)}
        >
          <Popup>Destination: {destination}</Popup>
        </Marker>

        {/* Route A Polyline (Blue) */}
        {routeA && (
          <Polyline
            positions={routeA.coordinates}
            pathOptions={{
              color: "#3978F6",
              weight: selectedRouteId === "route-a" ? 6 : 3.5,
              opacity: selectedRouteId === "route-a" ? 0.95 : 0.55
            }}
            eventHandlers={{
              click: () => onSelectRoute?.("route-a")
            }}
          >
            <Popup>
              <strong>{routeA.name}</strong>
              <br />
              Distance: {routeA.distanceKm} km
              <br />
              Est. Time: {Math.floor(routeA.estimatedTimeMin / 60)}h {routeA.estimatedTimeMin % 60}m
            </Popup>
          </Polyline>
        )}

        {/* Route B Polyline (Teal) */}
        {routeB && (
          <Polyline
            positions={routeB.coordinates}
            pathOptions={{
              color: "#22B8A7",
              weight: selectedRouteId === "route-b" ? 6 : 3.5,
              opacity: selectedRouteId === "route-b" ? 0.95 : 0.55
            }}
            eventHandlers={{
              click: () => onSelectRoute?.("route-b")
            }}
          >
            <Popup>
              <strong>{routeB.name}</strong>
              <br />
              Distance: {routeB.distanceKm} km
              <br />
              Est. Time: {Math.floor(routeB.estimatedTimeMin / 60)}h {routeB.estimatedTimeMin % 60}m
            </Popup>
          </Polyline>
        )}
      </MapContainer>
    </div>
  );
}
