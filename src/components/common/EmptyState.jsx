import React from "react";
import AttentiveFace from "./AttentiveFace";

export default function EmptyState({
  title = "No shipments yet.",
  description = "Create your first shipment to begin evaluating transportation routes.",
  action = null
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        background: "var(--surface)",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--border)"
      }}
    >
      <AttentiveFace width={140} height={170} />
      <h3 style={{ marginTop: 16, fontSize: 18, color: "var(--text-primary)" }}>{title}</h3>
      <p style={{ marginTop: 8, maxWidth: 420, color: "var(--text-secondary)", fontSize: 14 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
