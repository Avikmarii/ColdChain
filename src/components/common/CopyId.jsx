import React from "react";
import { Copy } from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";

export default function CopyId({ id, className = "" }) {
  const { showToast } = useShipments();

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(
        () => showToast(`${id} copied`, "Shipment ID copied to clipboard", "success"),
        () => showToast("Failed to copy", "Clipboard access was denied", "error")
      );
    } else {
      showToast(`${id} copied`, "Shipment ID copied", "success");
    }
  };

  return (
    <button
      type="button"
      className={`cc-copy-id ${className}`}
      onClick={handleCopy}
      title={`Copy shipment ID ${id}`}
      aria-label={`Copy shipment ID ${id}`}
    >
      <span>{id}</span>
      <Copy size={12} aria-hidden="true" />
    </button>
  );
}
