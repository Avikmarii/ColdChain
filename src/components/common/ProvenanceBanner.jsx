import React from "react";
import { Info } from "lucide-react";

export default function ProvenanceBanner({ text = "Demo simulation: illustrative results only.", extra = null, className = "" }) {
  return (
    <aside className={`cc-provenance-banner ${className}`} role="note" aria-label="Simulation provenance warning">
      <div className="cc-provenance-text">
        <Info size={16} aria-hidden="true" />
        <span>{text}</span>
      </div>
      {extra && <div className="cc-provenance-extra">{extra}</div>}
    </aside>
  );
}
