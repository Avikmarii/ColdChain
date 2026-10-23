import React from "react";
import { Clock, Navigation, AlertTriangle, CheckCircle2 } from "lucide-react";
import RiskBadge from "../common/RiskBadge";

export default function RouteCard({
  route,
  analysisResult = null,
  isSelected = false,
  onSelect,
  isPreferred = false
}) {
  const isAnalyzed = Boolean(analysisResult);
  const routeColor = route.id === "route-a" ? "#3978F6" : "#22B8A7";

  return (
    <div
      onClick={onSelect}
      className={`cc-card ${isSelected ? "is-selected" : ""}`}
      style={{
        cursor: "pointer",
        borderColor: isSelected ? routeColor : "var(--border)",
        boxShadow: isSelected ? `0 0 0 2px ${routeColor}33, var(--shadow-md)` : "var(--shadow-sm)",
        transition: "all 0.2s ease",
        position: "relative",
        background: isSelected ? "#FFFFFF" : "#FAFBFD"
      }}
    >
      {/* Route Color indicator pill */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 5,
          backgroundColor: routeColor,
          borderRadius: "var(--radius-md) 0 0 var(--radius-md)"
        }}
      />

      <div style={{ paddingLeft: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: routeColor,
                display: "inline-block"
              }}
            />
            <h3 style={{ fontSize: 16 }}>{route.name}</h3>
            {route.tag && (
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)"
                }}
              >
                {route.tag}
              </span>
            )}
          </div>

          {isPreferred && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#0E6245",
                background: "var(--success-pale)",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(22, 163, 106, 0.25)"
              }}
            >
              Preferred in Demo
            </span>
          )}
        </div>

        {/* Distance & Est. Time */}
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Navigation size={14} style={{ color: "var(--text-muted)" }} />
            <span>Distance: <strong style={{ color: "var(--text-primary)" }}>{route.distanceKm} km</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
            <span>Est. Time: <strong style={{ color: "var(--text-primary)" }}>{Math.floor(route.estimatedTimeMin / 60)}h {route.estimatedTimeMin % 60}m</strong></span>
          </div>
        </div>

        {/* Simulation Status Row */}
        <div
          style={{
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13
          }}
        >
          {!isAnalyzed ? (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              Not yet evaluated
            </span>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RiskBadge level={analysisResult.riskLevel} />
                <span
                  style={{
                    fontSize: 12,
                    color: analysisResult.constraintStatus === "meets" ? "var(--success)" : "var(--danger)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {analysisResult.constraintStatus === "meets" ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Meets limits</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} />
                      <span>{analysisResult.minutesOutOfRange}m excursion</span>
                    </>
                  )}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "var(--brand-blue)", fontWeight: 600 }}>
                {isSelected ? "Active View" : "Select Route"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
