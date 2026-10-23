import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";

function ToastItem({ toast }) {
  const { dispatch } = useShipments();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: toast.id });
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dispatch]);

  const handleDismiss = () => {
    dispatch({ type: "REMOVE_TOAST", payload: toast.id });
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 size={18} color="#16A36A" aria-hidden="true" />;
      case "warning":
        return <AlertTriangle size={18} color="#E9A23B" aria-hidden="true" />;
      case "error":
        return <AlertCircle size={18} color="#E05260" aria-hidden="true" />;
      default:
        return <Info size={18} color="#3978F6" aria-hidden="true" />;
    }
  };

  return (
    <div className="cc-toast" role="status">
      <div className="cc-toast-content">
        {getIcon()}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{toast.title}</div>
          {toast.message && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              {toast.message}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          style={{ color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
      <div
        className="cc-toast-countdown"
        style={{
          animationDuration: `${(toast.duration || 4000) / 1000}s`,
          background: toast.type === "success" ? "#16A36A" : toast.type === "error" ? "#E05260" : "var(--brand-blue)"
        }}
      />
    </div>
  );
}

export default function Toast() {
  const { state } = useShipments();

  if (!state.toasts || state.toasts.length === 0) return null;

  return (
    <div className="cc-toast-container" aria-live="polite">
      {state.toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
