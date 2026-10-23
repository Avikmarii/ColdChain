import React from "react";
import { Thermometer, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function AnalysisSummary({ analysisResult = null }) {
  const isEvaluated = Boolean(analysisResult);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginTop: 16
      }}
    >
      {/* Max Temperature */}
      <div className="cc-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          Max Simulated Temp
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          {isEvaluated ? `${analysisResult.maxC.toFixed(1)}°C` : <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Not yet evaluated</span>}
        </div>
      </div>

      {/* Min Temperature */}
      <div className="cc-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          Min Simulated Temp
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          {isEvaluated ? `${analysisResult.minC.toFixed(1)}°C` : <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Not yet evaluated</span>}
        </div>
      </div>

      {/* Excursion Count */}
      <div className="cc-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          Excursion Count
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          {isEvaluated ? `${analysisResult.excursions.length}` : <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Not yet evaluated</span>}
        </div>
      </div>

      {/* Minutes Outside Range */}
      <div className="cc-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          Total Time Out of Range
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: isEvaluated && analysisResult.minutesOutOfRange > 0 ? "var(--danger)" : "var(--text-primary)" }}>
          {isEvaluated ? `${analysisResult.minutesOutOfRange} min` : <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Not yet evaluated</span>}
        </div>
      </div>

      {/* Constraint Status */}
      <div className="cc-card" style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
          Constraint Status
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          {!isEvaluated ? (
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Not yet evaluated</span>
          ) : analysisResult.constraintStatus === "meets" ? (
            <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={16} /> Meets configured limits
            </span>
          ) : (
            <span style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={16} /> Does not meet limit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
