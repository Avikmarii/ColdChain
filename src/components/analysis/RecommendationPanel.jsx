import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
  Award
} from "lucide-react";
import RiskBadge from "../common/RiskBadge";

export default function RecommendationPanel({
  ranking,
  routes,
  analysisResults
}) {
  const preferredRouteId = ranking?.preferredRouteId;
  const isFeasible = Boolean(preferredRouteId);
  const preferredRoute = routes.find((r) => r.id === preferredRouteId);
  const preferredAnalysis = preferredRouteId ? analysisResults[preferredRouteId] : null;

  return (
    <div
      className="cc-card"
      style={{
        border: isFeasible ? "1px solid rgba(34, 184, 167, 0.4)" : "1px solid rgba(224, 82, 96, 0.4)",
        background: isFeasible ? "linear-gradient(180deg, #FFFFFF 0%, var(--teal-pale) 100%)" : "linear-gradient(180deg, #FFFFFF 0%, var(--danger-pale) 100%)",
        boxShadow: "var(--shadow-md)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {isFeasible ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--teal)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Award size={20} />
          </div>
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sm)",
              background: "var(--danger)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <ShieldAlert size={20} />
          </div>
        )}

        <div>
          <h2 style={{ fontSize: 18, color: "var(--text-primary)" }}>
            {isFeasible
              ? `${preferredRoute?.name} is preferred under current assumptions`
              : "No feasible route found under current assumptions"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            {isFeasible
              ? `${preferredRoute?.name} meets configured limits in this simulation with lowest thermal exposure.`
              : "All evaluated candidate corridors exceed configured temperature tolerances."}
          </p>
        </div>
      </div>

      {/* Reasons Checklist */}
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
          Evaluation Reasoning
        </h3>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {ranking?.reasons?.map((reason, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--text-primary)"
              }}
            >
              <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} />
              <span>{reason}</span>
            </li>
          ))}
          {!isFeasible && (
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--danger)"
              }}
            >
              <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
              <span>All candidate routes exceeded the configured product temperature threshold.</span>
            </li>
          )}
        </ul>
      </div>

      {/* Trade-offs */}
      {ranking?.tradeoffs && ranking.tradeoffs.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Simulated Trade-offs
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {ranking.tradeoffs.map((tradeoff, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--text-secondary)"
                }}
              >
                <Clock size={15} color="var(--brand-blue)" style={{ flexShrink: 0 }} />
                <span>{tradeoff}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limitations List */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(255, 255, 255, 0.75)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
          <Info size={14} />
          <span>Model Assumptions & Limitations</span>
        </div>
        <ul style={{ paddingLeft: 18, fontSize: 12, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
          {ranking?.limitations?.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
