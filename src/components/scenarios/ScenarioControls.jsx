import React from "react";
import { Sliders, RotateCcw, Play, Check } from "lucide-react";
import { INSULATION_OPTIONS } from "../../data/demoRoutes";

export default function ScenarioControls({
  routes,
  selectedRouteId,
  onSelectRoute,
  scenario,
  onScenarioChange,
  onReset,
  onRun
}) {
  return (
    <div className="cc-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Sliders size={18} color="var(--brand-blue)" />
        <h2 style={{ fontSize: 16 }}>What-If Scenario Controls</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Route Select */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Selected Route
          </label>
          <select
            className="cc-search-input"
            value={selectedRouteId}
            onChange={(e) => onSelectRoute(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.distanceKm} km, {Math.floor(r.estimatedTimeMin / 60)}h {r.estimatedTimeMin % 60}m)
              </option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
            Candidate highway corridor to simulate with modified variables.
          </span>
        </div>

        {/* Additional Delay Slider (0 to 180 min, step 5) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Additional Delay</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-blue-deep)" }}>
              {scenario.extraDelayMin} minutes
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={scenario.extraDelayMin}
            onChange={(e) => onScenarioChange("extraDelayMin", parseInt(e.target.value, 10))}
            style={{ width: "100%", accentColor: "var(--brand-blue)", cursor: "pointer" }}
            aria-label="Additional delay in minutes"
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
            Simulates traffic congestion, vehicle checkpoints, or unpredicted road diversions.
          </span>
        </div>

        {/* Ambient Temperature Slider (15 to 45 C, step 1) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Ambient Temperature</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-blue-deep)" }}>
              {scenario.ambientC}°C
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="45"
            step="1"
            value={scenario.ambientC}
            onChange={(e) => onScenarioChange("ambientC", parseInt(e.target.value, 10))}
            style={{ width: "100%", accentColor: "var(--brand-blue)", cursor: "pointer" }}
            aria-label="Ambient temperature in degrees Celsius"
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
            Simulates external meteorological conditions and asphalt heat radiation during transit.
          </span>
        </div>

        {/* Cooling Interruption Toggle */}
        <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
                Cooling Interruption
              </label>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Simulates compressor outage or door seal compromise mid-journey.
              </span>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={scenario.isInterrupted}
                onChange={(e) => onScenarioChange("isInterrupted", e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
                aria-label="Toggle cooling interruption"
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: scenario.isInterrupted ? "var(--danger)" : "#CBD5E1",
                  borderRadius: 24,
                  transition: "0.2s"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: scenario.isInterrupted ? 22 : 2,
                    top: 2,
                    width: 20,
                    height: 20,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s"
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Interruption Duration (0 to 120 min, shown only when toggle is on) */}
        {scenario.isInterrupted && (
          <div style={{ padding: "12px", background: "var(--danger-pale)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(224, 82, 96, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#9F1239" }}>Interruption Duration</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#9F1239" }}>
                {scenario.coolingInterruptionMin} minutes
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={scenario.coolingInterruptionMin}
              onChange={(e) => onScenarioChange("coolingInterruptionMin", parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "var(--danger)", cursor: "pointer" }}
              aria-label="Cooling interruption duration in minutes"
            />
            <span style={{ fontSize: 11, color: "#9F1239", marginTop: 4, display: "block" }}>
              Simulates duration before backup generator restore or repair.
            </span>
          </div>
        )}

        {/* Optional Insulation Preset */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Insulation Preset
          </label>
          <select
            className="cc-search-input"
            value={scenario.insulationPreset}
            onChange={(e) => onScenarioChange("insulationPreset", e.target.value)}
            style={{ cursor: "pointer" }}
          >
            {INSULATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
            Test thermal resilience under alternative packaging specs.
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={onReset}
            style={{ flex: 1 }}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            className="cc-btn cc-btn-primary"
            onClick={onRun}
            style={{ flex: 1.4 }}
          >
            <Play size={15} />
            <span>Run Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
}
