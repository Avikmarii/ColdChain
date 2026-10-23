import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import ShipmentForm from "../components/shipments/ShipmentForm";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import NotFound from "./NotFound";

export default function CreateShipment() {
  const { id } = useParams();
  const { getShipmentById } = useShipments();
  const isEditMode = Boolean(id);
  const existingShipment = isEditMode ? getShipmentById(id) : null;

  if (isEditMode && !existingShipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`Cannot edit shipment with ID "${id}" because it does not exist.`}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Configured parameters serve as model assumptions." />

      <div style={{ marginBottom: 20 }}>
        <Link
          to="/"
          className="cc-btn cc-btn-ghost cc-btn-sm"
          style={{ marginBottom: 8, paddingLeft: 0, display: "inline-flex" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
        <h1>{isEditMode ? `Edit Shipment: ${existingShipment.name}` : "Create New Shipment Analysis"}</h1>
        <p style={{ marginTop: 4, fontSize: 14 }}>
          {isEditMode
            ? "Update thermal tolerances, journey waypoints, or container configuration."
            : "Define candidate route parameters, permitted temperature tolerances, and packaging assumptions."}
        </p>
      </div>

      <ShipmentForm existingShipment={existingShipment} />
    </div>
  );
}
