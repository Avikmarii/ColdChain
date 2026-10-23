import React from "react";

export default function RiskBadge({ level }) {
  const normalized = (level || "low").toLowerCase();

  let badgeClass = "cc-risk-low";
  let labelText = "Low Risk";
  let mercuryHeight = 4; // out of 10
  let strokeColor = "#16A36A";

  if (normalized === "medium") {
    badgeClass = "cc-risk-medium";
    labelText = "Medium Risk";
    mercuryHeight = 7;
    strokeColor = "#E9A23B";
  } else if (normalized === "high") {
    badgeClass = "cc-risk-high";
    labelText = "High Risk";
    mercuryHeight = 10;
    strokeColor = "#E05260";
  }

  return (
    <span className={`cc-risk-badge ${badgeClass}`} title={`Thermal risk: ${labelText}`}>
      <svg
        className="cc-thermometer-svg"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Thermometer stem and bulb outline */}
        <path
          d="M8 2a1.5 1.5 0 0 0-1.5 1.5v6.17a3 3 0 1 0 3 0V3.5A1.5 1.5 0 0 0 8 2z"
          stroke={strokeColor}
          strokeWidth="1.2"
        />
        {/* Bulb mercury fill */}
        <circle cx="8" cy="11.5" r="1.8" fill={strokeColor} />
        {/* Stem mercury fill */}
        <rect
          x="7.2"
          y={11.5 - mercuryHeight}
          width="1.6"
          height={mercuryHeight}
          rx="0.8"
          fill={strokeColor}
        />
      </svg>
      <span>{labelText}</span>
    </span>
  );
}
