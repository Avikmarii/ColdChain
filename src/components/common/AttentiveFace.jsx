import React from "react";
import "../../styles/face.css";

/**
 * AttentiveFace (Appendix A)
 * A friendly animated face for empty states, 'no results' states, error states, and not-found.
 * aria-hidden="true" so screen readers rely on accompanying text messages.
 */
export default function AttentiveFace({ width = 150, height = 180, className = "" }) {
  return (
    <div
      className={`cc-face-wrap ${className}`}
      style={{ "--face-w": `${width}px`, "--face-h": `${height}px` }}
    >
      <svg
        className="face"
        viewBox="0 0 320 380"
        fill="none"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ overflow: "hidden" }}
      >
        <g className="face__eyes">
          <g transform="translate(105 120)">
            <path className="face__eye-lid" d="M-26 -22h52" />
            <path className="face__pupil" d="M0 -6v35" pathLength="35" strokeDasharray="35" />
          </g>
          <g transform="translate(215 120)">
            <path className="face__eye-lid" d="M-26 -22h52" />
            <path className="face__pupil" d="M0 -6v35" pathLength="35" strokeDasharray="35" />
          </g>
        </g>
        <path className="face__nose" d="M160 150v38h-16" />
        <path
          className="face__mouth-left"
          d="M160 290C140 308 112 308 92 282"
          pathLength="102"
          strokeDasharray="102"
        />
        <path
          className="face__mouth-right"
          d="M160 290C180 308 208 308 228 282"
          pathLength="102"
          strokeDasharray="102"
        />
      </svg>
    </div>
  );
}
