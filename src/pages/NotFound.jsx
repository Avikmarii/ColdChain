import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import AttentiveFace from "../components/common/AttentiveFace";

export default function NotFound({
  title = "Page Not Found",
  message = "The page or shipment record you are looking for does not exist or has been moved."
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 24px",
        minHeight: "60vh"
      }}
    >
      <AttentiveFace width={160} height={190} />
      <h1 style={{ marginTop: 24, fontSize: 24, color: "var(--text-primary)" }}>{title}</h1>
      <p style={{ marginTop: 8, maxWidth: 440, color: "var(--text-secondary)", fontSize: 14 }}>
        {message}
      </p>
      <div style={{ marginTop: 24 }}>
        <Link to="/" className="cc-btn cc-btn-primary">
          <Home size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
