import React, { useState, useEffect, useRef } from "react";

export default function StatCard({ label, value, subtext, icon: Icon, color = "blue" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // If already animated once or if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion");

    const target = typeof value === "number" ? value : parseInt(value, 10) || 0;

    if (hasAnimatedRef.current || prefersReducedMotion) {
      setDisplayValue(target);
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 500; // 500ms within 400-600ms range
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="cc-stat-card">
      <div className="cc-stat-header">
        <span className="cc-stat-label">{label}</span>
        {Icon && (
          <div className="cc-stat-icon-wrap" aria-hidden="true">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="cc-stat-value" aria-label={`${label}: ${value}`}>
        {displayValue}
      </div>
      {subtext && <div className="cc-stat-subtext">{subtext}</div>}
    </div>
  );
}
