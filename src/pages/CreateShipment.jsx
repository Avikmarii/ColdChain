import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Thermometer,
  Truck,
  Box,
  FileText,
  AlertCircle,
  Save,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { validateShipmentForm } from "../utils/validation";
import {
  PRODUCT_CATEGORIES,
  INSULATION_OPTIONS,
  COOLING_OPTIONS,
  isRoutePairSupported
} from "../data/demoRoutes";
import { DEMO_CITIES } from "../data/routeGeometry";
import { api } from "../services/api";
import ProvenanceBanner from "../components/common/ProvenanceBanner";
import NotFound from "./NotFound";

export default function CreateShipment() {
  const { id: rawId } = useParams();
  const id = rawId ? decodeURIComponent(rawId) : null;
  const navigate = useNavigate();
  const { state, dispatch, showToast, addToast: contextAddToast, getShipmentById } = useShipments();

  const addToast = (msg, type = "info") => {
    if (contextAddToast) {
      contextAddToast(msg, type);
    } else {
      showToast(type === "error" ? "Error" : "Notification", msg, type);
    }
  };

  const isEdit = Boolean(id);
  const existingShipment = isEdit ? getShipmentById(id) : null;

  const fieldRefs = {
    id: useRef(null),
    name: useRef(null),
    origin: useRef(null),
    destination: useRef(null),
    departureDateTime: useRef(null),
    maxTransitHours: useRef(null),
    minC: useRef(null),
    maxC: useRef(null)
  };

  const getNextSequentialId = () => {
    const maxNum = (state?.shipments || []).reduce((acc, curr) => {
      const match = curr.id?.match(/^CC-(\d+)$/i);
      return match ? Math.max(acc, parseInt(match[1], 10)) : acc;
    }, 0);
    return `CC-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const [formData, setFormData] = useState(() => {
    if (existingShipment) {
      return {
        id: existingShipment.id,
        name: existingShipment.name || "",
        category: existingShipment.category || "Vaccine",
        description: existingShipment.description || "",
        origin: existingShipment.origin || "Bengaluru",
        destination: existingShipment.destination || "Mysuru",
        departureDateTime: existingShipment.departureDateTime || "2026-10-24T09:00",
        maxTransitHours: existingShipment.maxTransitHours || 5,
        minC: existingShipment.temperatureLimits?.minC ?? 2.0,
        maxC: existingShipment.temperatureLimits?.maxC ?? 8.0,
        limitsSource: existingShipment.temperatureLimits?.source || "",
        source: existingShipment.temperatureLimits?.source || "",
        isDemoAssumption: existingShipment.temperatureLimits?.isDemoAssumption || false,
        tempNotes: existingShipment.temperatureLimits?.notes || "",
        insulation: existingShipment.container?.insulation || "Moderate",
        coolingSystem: existingShipment.container?.coolingSystem || "Active (Refrigerated)",
        containerNotes: existingShipment.container?.notes || ""
      };
    }

    if (state.formDraft) {
      return {
        ...state.formDraft,
        id: state.formDraft.id || getNextSequentialId()
      };
    }

    return {
      id: getNextSequentialId(),
      name: "",
      category: "Vaccine",
      description: "",
      origin: "Bengaluru",
      destination: "Mysuru",
      departureDateTime: "2026-10-24T09:00",
      maxTransitHours: 5,
      minC: 2.0,
      maxC: 8.0,
      limitsSource: "WHO Technical Spec Annex 4",
      source: "WHO Technical Spec Annex 4",
      isDemoAssumption: true,
      tempNotes: "",
      insulation: "Moderate",
      coolingSystem: "Active (Refrigerated)",
      containerNotes: "Standard insulated container"
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync draft in local storage for in-progress creates
  useEffect(() => {
    if (!isEdit) {
      dispatch({ type: "SAVE_FORM_DRAFT", payload: formData });
    }
  }, [formData, isEdit, dispatch]);

  const handleGenerateSuggestedId = () => {
    const nextId = getNextSequentialId();
    setFormData((prev) => ({ ...prev, id: nextId }));
    if (errors.id) setErrors((prev) => ({ ...prev, id: null }));
    addToast(`Assigned suggested ID: ${nextId}`);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const applyPreset2to8 = () => {
    setFormData((prev) => ({
      ...prev,
      minC: 2.0,
      maxC: 8.0,
      limitsSource: "Demo assumption: 2°C to 8°C cold-chain guideline",
      source: "Demo assumption: 2°C to 8°C cold-chain guideline",
      isDemoAssumption: true
    }));
    setErrors((prev) => ({ ...prev, minC: null, maxC: null }));
    addToast("2°C to 8°C applied as demo assumption");
  };

  const handleSave = async (generateAnalysis = false) => {
    const currentId = isEdit ? existingShipment.id : null;
    const { isValid, errors: validationErrors } = validateShipmentForm(
      formData,
      state.shipments,
      currentId
    );

    if (!isValid) {
      setErrors(validationErrors);
      const firstInvalidKey = Object.keys(validationErrors)[0];
      if (fieldRefs[firstInvalidKey]?.current) {
        fieldRefs[firstInvalidKey].current.focus();
      }
      addToast("Please correct highlighted form errors.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        category: formData.category,
        description: (formData.description || "").trim(),
        origin: formData.origin,
        destination: formData.destination,
        departureDateTime: formData.departureDateTime,
        maxTransitHours: parseFloat(formData.maxTransitHours),
        temperatureLimits: {
          minC: parseFloat(formData.minC),
          maxC: parseFloat(formData.maxC),
          unit: "C",
          source: formData.limitsSource || formData.source || "User configured",
          isDemoAssumption: Boolean(formData.isDemoAssumption),
          notes: formData.tempNotes || ""
        },
        container: {
          insulation: formData.insulation,
          coolingSystem: formData.coolingSystem,
          notes: formData.containerNotes || ""
        },
        status: isEdit ? existingShipment.status : "Draft",
        selectedRouteId: isEdit ? existingShipment.selectedRouteId : null,
        assignedDriver: isEdit ? existingShipment.assignedDriver : null,
        isDemoRecord: isEdit ? Boolean(existingShipment.isDemoRecord) : false,
        source: isEdit ? (existingShipment.source || "user") : "user"
      };

      let res;
      if (isEdit) {
        res = await api.updateShipment(existingShipment.id, payload);
        dispatch({
          type: "UPDATE_SHIPMENT",
          payload: { originalId: existingShipment.id, updatedShipment: res.data }
        });
      } else {
        res = await api.createShipment(payload);
        dispatch({ type: "UPSERT_LOCAL_SHIPMENT", payload: res.data });
      }

      dispatch({ type: "CLEAR_FORM_DRAFT" });

      if (generateAnalysis) {
        addToast(
          isEdit ? "Shipment updated. Opening analysis." : "Shipment created. Opening analysis.",
          "success"
        );
        navigate(`/shipments/${encodeURIComponent(payload.id)}/analysis`);
      } else {
        addToast(
          isEdit ? "Shipment parameters updated." : "Draft shipment saved.",
          "success"
        );
        navigate(`/shipments/${encodeURIComponent(payload.id)}`);
      }
    } catch (err) {
      const msg = err.message || "Failed to save shipment.";
      if (err.code === "DUPLICATE_ID" || err.code === "CONFLICT" || msg.toLowerCase().includes("already exists")) {
        setErrors((prev) => ({
          ...prev,
          id: "Shipment ID already exists. Enter a unique identifier."
        }));
        if (fieldRefs.id?.current) fieldRefs.id.current.focus();
      }
      addToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEdit && !existingShipment) {
    return (
      <NotFound
        title="Shipment Not Found"
        message={`Cannot edit shipment with ID "${id}" because it does not exist.`}
      />
    );
  }

  const isCorridorSupported = isRoutePairSupported(formData.origin, formData.destination);

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
        <h1>{isEdit ? `Edit Shipment: ${existingShipment.name}` : "Create New Shipment Analysis"}</h1>
        <p style={{ marginTop: 4, fontSize: 14 }}>
          {isEdit
            ? "Update thermal tolerances, journey waypoints, or container configuration."
            : "Define candidate route parameters, permitted temperature tolerances, and packaging assumptions."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave(true);
        }}
        className="cc-form-container"
      >
        {/* SECTION A: Shipment Details */}
        <section className="cc-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="cc-stat-icon-wrap" aria-hidden="true">
              <FileText size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16 }}>A. Shipment Details</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Define the shipment identifier, descriptive label, and product category.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16
            }}
          >
            {/* ID (Manual alphanumeric input with auto-suggest) */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Shipment ID <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <input
                  ref={fieldRefs.id}
                  type="text"
                  className="cc-search-input"
                  placeholder="e.g. CC-101, EXP-MYS-42"
                  value={formData.id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, id: val }));
                    if (errors.id) setErrors((prev) => ({ ...prev, id: null }));
                  }}
                  style={{
                    fontWeight: 600,
                    fontFamily: "monospace",
                    flex: 1,
                    ...(errors.id ? { borderColor: "var(--danger)", background: "#FFF5F5" } : {})
                  }}
                  aria-label="Shipment ID"
                  aria-required="true"
                  aria-invalid={Boolean(errors.id)}
                />
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={handleGenerateSuggestedId}
                  title="Fill next sequential CC-### ID"
                  style={{ whiteSpace: "nowrap", flexShrink: 0, fontSize: 12, padding: "6px 12px" }}
                  aria-label="Auto-suggest ID"
                >
                  <Sparkles size={14} />
                  <span>Auto-suggest ID</span>
                </button>
              </div>
              {errors.id && (
                <p
                  style={{
                    color: "var(--danger)",
                    fontSize: 12,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <AlertCircle size={12} /> {errors.id}
                </p>
              )}
            </div>

            {/* Name (Required) */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Shipment Name <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fieldRefs.name}
                type="text"
                className="cc-search-input"
                placeholder="e.g. Vaccine Batch 104"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                style={errors.name ? { borderColor: "var(--danger)", background: "#FFF5F5" } : {}}
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p
                  style={{
                    color: "var(--danger)",
                    fontSize: 12,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Product Category <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                className="cc-search-input"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Description <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              className="cc-search-input"
              placeholder="Clinical lot batch or handling directives..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </section>

        {/* SECTION B: Journey Details */}
        <section className="cc-card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="cc-stat-icon-wrap" aria-hidden="true">
              <Truck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16 }}>B. Journey & Transit Limits</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Specify the transport corridor and maximum acceptable journey duration.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16
            }}
          >
            {/* Origin */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Origin City <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                ref={fieldRefs.origin}
                className="cc-search-input"
                value={formData.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {DEMO_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Destination City <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                ref={fieldRefs.destination}
                className="cc-search-input"
                value={formData.destination}
                onChange={(e) => handleChange("destination", e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {DEMO_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Date & Time */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Departure Date & Time <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fieldRefs.departureDateTime}
                type="datetime-local"
                className="cc-search-input"
                value={formData.departureDateTime}
                onChange={(e) => handleChange("departureDateTime", e.target.value)}
                style={errors.departureDateTime ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.departureDateTime && (
                <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
                  {errors.departureDateTime}
                </p>
              )}
            </div>

            {/* Max Transit Time */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Max Acceptable Transit Time (hours) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fieldRefs.maxTransitHours}
                type="number"
                min="0.5"
                max="72"
                step="0.5"
                className="cc-search-input"
                value={formData.maxTransitHours}
                onChange={(e) => handleChange("maxTransitHours", e.target.value)}
                style={errors.maxTransitHours ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.maxTransitHours && (
                <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
                  {errors.maxTransitHours}
                </p>
              )}
            </div>
          </div>

          {/* Destination error or corridor validation warning */}
          {errors.destination && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "var(--warning-pale)",
                border: "1px solid rgba(233, 162, 59, 0.3)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                color: "#9A3412",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <AlertCircle size={16} />
              <span>{errors.destination}</span>
            </div>
          )}
          {!errors.destination && !isCorridorSupported && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "var(--warning-pale)",
                border: "1px solid rgba(233, 162, 59, 0.3)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                color: "#9A3412",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <AlertCircle size={16} />
              <span>
                No precomputed route geometry exists for <strong>{formData.origin} → {formData.destination}</strong>.
              </span>
            </div>
          )}
        </section>

        {/* SECTION C: Temperature Requirements */}
        <section className="cc-card" style={{ marginBottom: 20 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="cc-stat-icon-wrap" aria-hidden="true">
                <Thermometer size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 16 }}>C. Permitted Temperature Band</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Limits must originate from the product's official manufacturer specification.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="cc-btn cc-btn-secondary cc-btn-sm"
              onClick={applyPreset2to8}
              title="Fill 2°C to 8°C demo preset"
              style={{
                borderColor: "var(--brand-blue)",
                color: "var(--brand-blue-deep)",
                background: "var(--soft-blue)"
              }}
            >
              <Sparkles size={14} />
              <span>Demo preset: 2°C to 8°C</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16
            }}
          >
            {/* Min Temp */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Minimum Temperature (°C) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fieldRefs.minC}
                type="number"
                step="0.1"
                className="cc-search-input"
                value={formData.minC}
                onChange={(e) => handleChange("minC", e.target.value)}
                style={errors.minC ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.minC && (
                <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
                  {errors.minC}
                </p>
              )}
            </div>

            {/* Max Temp */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Maximum Temperature (°C) <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                ref={fieldRefs.maxC}
                type="number"
                step="0.1"
                className="cc-search-input"
                value={formData.maxC}
                onChange={(e) => handleChange("maxC", e.target.value)}
                style={errors.maxC ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.maxC && (
                <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
                  {errors.maxC}
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Unit
              </label>
              <input
                type="text"
                className="cc-search-input"
                value="Celsius (°C)"
                readOnly
                style={{ background: "var(--surface-subtle)" }}
              />
            </div>

            {/* Limits Source */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Limits Reference / Source
              </label>
              <input
                type="text"
                className="cc-search-input"
                placeholder="e.g. WHO PQS E003 or Lab Spec"
                value={formData.source}
                onChange={(e) => {
                  handleChange("source", e.target.value);
                  handleChange("limitsSource", e.target.value);
                  handleChange("isDemoAssumption", false);
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-muted)"
            }}
          >
            <Info size={14} />
            <span>
              {formData.isDemoAssumption
                ? "Labeled as Demo assumption. Production limits must derive from validated product stability data."
                : "User-defined product specification source."}
            </span>
          </div>
        </section>

        {/* SECTION D: Container & Cooling Assumptions */}
        <section className="cc-card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="cc-stat-icon-wrap" aria-hidden="true">
              <Box size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16 }}>D. Container & Thermal Model Inputs</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Thermal inputs used for the simulation engine (not physical telemetry readings).
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16
            }}
          >
            {/* Insulation */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Insulation Quality
              </label>
              <select
                className="cc-search-input"
                value={formData.insulation}
                onChange={(e) => handleChange("insulation", e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {INSULATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginTop: 4
                }}
              >
                Basic: single-wall; Moderate: polyurethane foam; High: vacuum-insulated panels.
              </span>
            </div>

            {/* Cooling Mode */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Cooling Mechanism
              </label>
              <select
                className="cc-search-input"
                value={formData.coolingSystem}
                onChange={(e) => handleChange("coolingSystem", e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {COOLING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  display: "block",
                  marginTop: 4
                }}
              >
                Active maintains active temperature regulation; Passive relies on eutectic pre-chilled packs.
              </span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Container Notes <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              className="cc-search-input"
              placeholder="Equipment serial, packout configuration, or battery warranty..."
              value={formData.containerNotes}
              onChange={(e) => handleChange("containerNotes", e.target.value)}
            />
          </div>
        </section>

        {/* Form Action Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 12
          }}
        >
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              <Save size={16} />
              <span>{isSubmitting ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              type="submit"
              className="cc-btn cc-btn-primary"
              disabled={isSubmitting || !isCorridorSupported}
              style={!isCorridorSupported ? { opacity: 0.6, cursor: "not-allowed" } : {}}
            >
              <span>{isSubmitting ? "Processing..." : "Generate Route Analysis"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
