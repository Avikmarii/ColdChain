import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend
} from "recharts";
import { Info, AlertTriangle } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: "var(--brand-blue-deep)" }}>
          <span>Simulated: {data.tempC.toFixed(1)}°C</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function TemperatureChart({
  analysisResult,
  routeName = "Route A",
  limits = { minC: 2.0, maxC: 8.0 }
}) {
  if (!analysisResult) {
    return (
      <div
        className="cc-card"
        style={{
          height: 280,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: "#FAFBFD",
          border: "1px dashed var(--border)"
        }}
      >
        <Info size={28} color="var(--brand-blue)" />
        <h4 style={{ marginTop: 10, fontSize: 16 }}>Awaiting Route Simulation</h4>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, maxWidth: 420 }}>
          Click "Run Demo Analysis" above to calculate simulated temperature changes and detect thermal breach durations along this highway corridor.
        </p>
      </div>
    );
  }

  const { series, maxC, minC } = analysisResult;
  const { minC: limitMin, maxC: limitMax } = limits;

  // Format chart data with hour labels
  const chartData = series.map((pt) => ({
    ...pt,
    hourLabel: `${(pt.tMin / 60).toFixed(1)}h`
  }));

  // Calculate suitable Y-axis bounds
  const yDomainMin = Math.floor(Math.min(limitMin - 2, minC - 1));
  const yDomainMax = Math.ceil(Math.max(limitMax + 2, maxC + 1));

  return (
    <div className="cc-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16
        }}
      >
        <div>
          <h3 style={{ fontSize: 16 }}>Simulated Temperature Over Time ({routeName})</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Simulated estimate under current model assumptions (ambient 32°C, moderate insulation)
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, background: "rgba(34, 184, 167, 0.25)", border: "1px solid #22B8A7", borderRadius: 2 }} />
            <span>Permitted Range ({limitMin}°C to {limitMax}°C)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 3, background: "#3978F6", borderRadius: 2 }} />
            <span>Simulated estimate</span>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              {/* Soft diagonal hatch pattern for excursion zones (Appendix A / 3.1 #6) */}
              <pattern
                id="diagonalHatch"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
              >
                <path
                  d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4"
                  stroke="#E05260"
                  strokeWidth="1.2"
                  opacity="0.45"
                />
              </pattern>
            </defs>

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

            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Permitted Range Band */}
            <ReferenceArea
              y1={limitMin}
              y2={limitMax}
              fill="#22B8A7"
              fillOpacity={0.12}
              label={{
                value: `Permitted Band (${limitMin}°C - ${limitMax}°C)`,
                position: "insideTopRight",
                fill: "#0C6B5E",
                fontSize: 11
              }}
            />

            {/* Hatched Excursion Zone (Upper breach area above limitMax) */}
            {maxC > limitMax && (
              <ReferenceArea
                y1={limitMax}
                y2={yDomainMax}
                fill="url(#diagonalHatch)"
                fillOpacity={0.8}
              />
            )}

            {/* Limit Threshold Lines */}
            <ReferenceLine
              y={limitMax}
              stroke="#E05260"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={limitMin}
              stroke="#3978F6"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Simulated Trend Line with 700ms draw-in animation */}
            <Line
              type="monotone"
              dataKey="tempC"
              name="Simulated estimate"
              stroke="#3978F6"
              strokeWidth={2.8}
              dot={false}
              activeDot={{ r: 5, fill: "#3978F6", stroke: "#FFFFFF", strokeWidth: 2 }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
