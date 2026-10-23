import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  Legend
} from "recharts";
import { Clock, Thermometer, AlertTriangle, CheckCircle2, Info } from "lucide-react";

function ScenarioTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = Math.floor(data.tMin / 60);
    const mins = data.tMin % 60;
    const timeFormatted = `${hours}h ${mins.toString().padStart(2, "0")}m`;

    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          padding: "8px 12px",
          borderRadius: 8,
          boxShadow: "var(--shadow-md)",
          fontSize: 12
        }}
      >
        <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
          Elapsed: {timeFormatted} ({data.tMin}m)
        </div>
        {payload.map((entry) => (
          <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: entry.color }}>
            <span>{entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}°C</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ScenarioComparison({
  baselineResult,
  modifiedResult,
  explanation,
  limits = { minC: 2.0, maxC: 8.0 }
}) {
  const { minC: limitMin, maxC: limitMax } = limits;

  // Merge baseline and modified series onto common tMin steps
  const maxTMin = Math.max(
    baselineResult.travelTimeMin,
    modifiedResult.travelTimeMin
  );

  const mergedData = [];
  const bMap = new Map(baselineResult.series.map((p) => [p.tMin, p.tempC]));
  const mMap = new Map(modifiedResult.series.map((p) => [p.tMin, p.tempC]));

  for (let t = 0; t <= maxTMin; t += 5) {
    mergedData.push({
      tMin: t,
      hourLabel: `${(t / 60).toFixed(1)}h`,
      Baseline: bMap.has(t) ? bMap.get(t) : undefined,
      Modified: mMap.has(t) ? mMap.get(t) : undefined
    });
  }

  const yDomainMin = Math.floor(Math.min(limitMin - 2, baselineResult.minC - 1, modifiedResult.minC - 1));
  const yDomainMax = Math.ceil(Math.max(limitMax + 2, baselineResult.maxC + 1, modifiedResult.maxC + 1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Baseline vs Modified Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Baseline Card */}
        <div className="cc-card" style={{ background: "#FAFBFD" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3978F6" }} />
            <h3 style={{ fontSize: 15 }}>Baseline Scenario</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Transit Time:</span>
              <strong>{Math.floor(baselineResult.travelTimeMin / 60)}h {baselineResult.travelTimeMin % 60}m</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Max Temp:</span>
              <strong style={{ color: baselineResult.maxC > limitMax ? "var(--danger)" : "var(--text-primary)" }}>
                {baselineResult.maxC.toFixed(1)}°C
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Excursions:</span>
              <strong style={{ color: baselineResult.excursions.length > 0 ? "var(--danger)" : "var(--success)" }}>
                {baselineResult.excursions.length === 0 ? "None" : `${baselineResult.minutesOutOfRange} min`}
              </strong>
            </div>
          </div>
        </div>

        {/* Modified Card */}
        <div
          className="cc-card"
          style={{
            borderColor: modifiedResult.constraintStatus === "fails" ? "var(--danger)" : "var(--teal)",
            background: "#FFFFFF"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E05260" }} />
            <h3 style={{ fontSize: 15 }}>Modified Scenario</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Transit Time:</span>
              <strong>{Math.floor(modifiedResult.travelTimeMin / 60)}h {modifiedResult.travelTimeMin % 60}m</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Max Temp:</span>
              <strong style={{ color: modifiedResult.maxC > limitMax ? "var(--danger)" : "var(--text-primary)" }}>
                {modifiedResult.maxC.toFixed(1)}°C
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Excursions:</span>
              <strong style={{ color: modifiedResult.excursions.length > 0 ? "var(--danger)" : "var(--success)" }}>
                {modifiedResult.excursions.length === 0 ? "None" : `${modifiedResult.minutesOutOfRange} min`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Graph */}
      <div className="cc-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>Thermal Curve Comparison</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Baseline (blue) vs Modified (coral red) under simulated scenario variations
            </p>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#3978F6", borderRadius: 2 }} />
              <span>Baseline</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#E05260", borderRadius: 2 }} />
              <span>Modified</span>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={mergedData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="hourLabel"
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                tick={{ fontSize: 12, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                unit="°C"
              />
              <Tooltip content={<ScenarioTooltip />} />

              {/* Shaded Permitted Band */}
              <ReferenceArea
                y1={limitMin}
                y2={limitMax}
                fill="#22B8A7"
                fillOpacity={0.12}
              />
              <ReferenceLine y={limitMax} stroke="#E05260" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={limitMin} stroke="#3978F6" strokeDasharray="4 4" strokeWidth={1.5} />

              {/* Baseline Curve */}
              <Line
                type="monotone"
                dataKey="Baseline"
                stroke="#3978F6"
                strokeWidth={2.4}
                dot={false}
                connectNulls={false}
              />

              {/* Modified Scenario Curve */}
              <Line
                type="monotone"
                dataKey="Modified"
                stroke="#E05260"
                strokeWidth={2.8}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* One-sentence hedged explanation box */}
      <div
        className="cc-card"
        style={{
          background: "var(--soft-blue)",
          borderColor: "rgba(57, 120, 246, 0.3)",
          display: "flex",
          alignItems: "flex-start",
          gap: 12
        }}
      >
        <Info size={18} color="var(--brand-blue-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-blue-deep)" }}>
            Scenario Simulation Assessment
          </div>
          <p style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
