import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { useShipments } from "../../context/ShipmentContext";
import {
  PRODUCT_CATEGORIES,
  INSULATION_OPTIONS,
  COOLING_OPTIONS
} from "../../data/demoRoutes";
import { DEMO_CITIES, getRoutePairGeometry } from "../../data/routeGeometry";

function getNextShipmentId(shipments) {
  let maxId = 0;
  shipments.forEach((s) => {
    const match = s.id.match(/^CC-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) maxId = num;
    }
  });
  return `CC-${String(maxId + 1).padStart(3, "0")}`;
}

export default function ShipmentForm({ existingShipment = null }) {
  const navigate = useNavigate();
  const { state, dispatch, showToast } = useShipments();
  const isEditMode = Boolean(existingShipment);

  // Auto-generated ID (read-only)
  const [shipmentId] = useState(
    existingShipment ? existingShipment.id : getNextShipmentId(state.shipments)
  );

  // Initial values: use existing shipment, restored draft, or sensible defaults
  const [formData, setFormData] = useState(() => {
    if (existingShipment) {
      return {
        name: existingShipment.name || "",
        category: existingShipment.category || "Vaccine",
        description: existingShipment.description || "",
        origin: existingShipment.origin || "Bengaluru",
        destination: existingShipment.destination || "Mysuru",
        departureDateTime: existingShipment.departureDateTime || "2026-10-24T09:00",
        maxTransitHours: existingShipment.maxTransitHours || 5,
        minC: existingShipment.temperatureLimits?.minC ?? 2.0,
        maxC: existingShipment.temperatureLimits?.maxC ?? 8.0,
        source: existingShipment.temperatureLimits?.source || "",
        isDemoAssumption: existingShipment.temperatureLimits?.isDemoAssumption || false,
        tempNotes: existingShipment.temperatureLimits?.notes || "",
        insulation: existingShipment.container?.insulation || "Moderate",
        coolingSystem: existingShipment.container?.coolingSystem || "Active (Refrigerated)",
        containerNotes: existingShipment.container?.notes || ""
      };
    }

    if (state.formDraft) {
      return state.formDraft;
    }

    return {
      name: "",
      category: "Vaccine",
      description: "",
      origin: "Bengaluru",
      destination: "Mysuru",
      departureDateTime: "2026-10-24T09:00",
      maxTransitHours: 5,
      minC: 2.0,
      maxC: 8.0,
      source: "WHO Technical Spec Annex 4",
      isDemoAssumption: true,
      tempNotes: "",
      insulation: "Moderate",
      coolingSystem: "Active (Refrigerated)",
      containerNotes: "Standard insulated container"
    };
  });

  const [errors, setErrors] = useState({});
  const [isCityPairValid, setIsCityPairValid] = useState(true);

  // Field refs for auto-focusing the first invalid field
  const nameRef = useRef(null);
  const minCRef = useRef(null);
  const maxCRef = useRef(null);
  const transitRef = useRef(null);

  // Auto-save form draft to context when creating new shipment
  useEffect(() => {
    if (!isEditMode) {
      dispatch({ type: "SAVE_FORM_DRAFT", payload: formData });
    }
  }, [formData, isEditMode, dispatch]);

  // Check if origin and destination pair has precomputed route geometry
  useEffect(() => {
    const geom = getRoutePairGeometry(formData.origin, formData.destination);
    setIsCityPairValid(Boolean(geom));
  }, [formData.origin, formData.destination]);

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
      source: "Demo assumption: 2°C to 8°C cold-chain guideline",
      isDemoAssumption: true
    }));
    setErrors((prev) => ({ ...prev, minC: null, maxC: null }));
    showToast("Preset Applied", "2°C to 8°C applied as demo assumption", "info");
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "Shipment name is required";
    }

    if (formData.minC === "" || isNaN(Number(formData.minC))) {
      errs.minC = "Minimum temperature is required and must be numeric";
    }
    if (formData.maxC === "" || isNaN(Number(formData.maxC))) {
      errs.maxC = "Maximum temperature is required and must be numeric";
    }

    const minNum = parseFloat(formData.minC);
    const maxNum = parseFloat(formData.maxC);
    if (!isNaN(minNum) && !isNaN(maxNum)) {
      if (minNum >= maxNum) {
        errs.maxC = "Maximum temperature must be strictly greater than minimum temperature";
      }
    }

    if (!formData.maxTransitHours || Number(formData.maxTransitHours) <= 0) {
      errs.maxTransitHours = "Transit time limit must be greater than 0 hours";
    }

    if (!isCityPairValid) {
      errs.destination = `No precomputed route geometry exists for ${formData.origin} → ${formData.destination}`;
    }

    setErrors(errs);

    // Focus first invalid element
    if (errs.name) nameRef.current?.focus();
    else if (errs.minC) minCRef.current?.focus();
    else if (errs.maxC) maxCRef.current?.focus();
    else if (errs.maxTransitHours) transitRef.current?.focus();

    return Object.keys(errs).length === 0;
  };

  const buildShipmentRecord = (status = "Draft") => {
    const nowIso = new Date().toISOString();
    const isTempOrContainerEdited =
      existingShipment &&
      (existingShipment.temperatureLimits.minC !== parseFloat(formData.minC) ||
        existingShipment.temperatureLimits.maxC !== parseFloat(formData.maxC) ||
        existingShipment.container.insulation !== formData.insulation ||
        existingShipment.container.coolingSystem !== formData.coolingSystem);

    let finalStatus = status;
    let finalAnalysis = existingShipment?.analysis || null;
    let activityLog = existingShipment?.activity ? [...existingShipment.activity] : [];

    if (isTempOrContainerEdited && existingShipment.status !== "Draft") {
      finalStatus = "Draft";
      finalAnalysis = null;
      activityLog.push({
        at: nowIso,
        text: "Parameters updated; previous simulation cleared to prevent stale metrics",
        provenance: "user-reported"
      });
      showToast(
        "Simulation Reset to Draft",
        "Temperature or container parameters modified; previous simulation cleared.",
        "warning"
      );
    } else if (!existingShipment) {
      activityLog.push({
        at: nowIso,
        text: "Shipment created",
        provenance: "user-reported"
      });
    } else {
      activityLog.push({
        at: nowIso,
        text: "Shipment details updated",
        provenance: "user-reported"
      });
    }

    return {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      origin: formData.origin,
      destination: formData.destination,
      departureDateTime: formData.departureDateTime,
      maxTransitHours: parseFloat(formData.maxTransitHours),
      temperatureLimits: {
        minC: parseFloat(formData.minC),
        maxC: parseFloat(formData.maxC),
        unit: "C",
        source: formData.source || "User-configured specification",
        isDemoAssumption: Boolean(formData.isDemoAssumption),
        notes: formData.tempNotes
      },
      container: {
        insulation: formData.insulation,
        coolingSystem: formData.coolingSystem,
        notes: formData.containerNotes
      },
      status
    };
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "A shipment name is required to save a draft" });
      nameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildShipmentRecord("Draft");
      let res;
      if (isEditMode) {
        res = await api.updateShipment(existingShipment.id, payload);
      } else {
        res = await api.createShipment(payload);
      }

      const saved = res.data;
      dispatch({ type: "UPSERT_LOCAL_SHIPMENT", payload: saved });
      dispatch({ type: "CLEAR_FORM_DRAFT" });
      showToast("Draft Saved", `${saved.name} (${saved.id}) saved to database as draft`, "success");
      navigate(`/shipments/${saved.id}`);
    } catch (err) {
      showToast("Save Failed", err.message || "Failed to save draft to database.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAnalysis = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Validation Error", "Please resolve highlighted fields before proceeding", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildShipmentRecord(isEditMode ? existingShipment.status : "Draft");
      let res;
      if (isEditMode) {
        res = await api.updateShipment(existingShipment.id, payload);
      } else {
        res = await api.createShipment(payload);
      }

      const saved = res.data;
      dispatch({ type: "UPSERT_LOCAL_SHIPMENT", payload: saved });
      dispatch({ type: "CLEAR_FORM_DRAFT" });
      showToast("Shipment Saved", "Opening route comparison and analysis", "success");
      navigate(`/shipments/${saved.id}/analysis`);
    } catch (err) {
      showToast("Operation Failed", err.message || "Failed to persist shipment parameters.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleGenerateAnalysis} className="cc-form-container">
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {/* ID (Read-only) */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Shipment ID <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(auto-generated)</span>
            </label>
            <input
              type="text"
              className="cc-search-input"
              value={shipmentId}
              readOnly
              style={{ background: "var(--surface-subtle)", fontWeight: 600, fontFamily: "monospace" }}
              aria-label="Shipment ID"
            />
          </div>

          {/* Name (Required) */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Shipment Name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              ref={nameRef}
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
              <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {/* Origin */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Origin City <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select
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
              Departure Date & Time
            </label>
            <input
              type="datetime-local"
              className="cc-search-input"
              value={formData.departureDateTime}
              onChange={(e) => handleChange("departureDateTime", e.target.value)}
            />
          </div>

          {/* Max Transit Time */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Max Acceptable Transit Time (hours) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              ref={transitRef}
              type="number"
              min="1"
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

        {/* Corridor validation warning */}
        {!isCityPairValid && (
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
              No precomputed route geometry exists for <strong>{formData.origin} → {formData.destination}</strong>. Please select a supported pair (e.g., Bengaluru to Mysuru, Chennai, Hyderabad, Pune; or Delhi to Jaipur).
            </span>
          </div>
        )}
      </section>

      {/* SECTION C: Temperature Requirements */}
      <section className="cc-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
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
            style={{ borderColor: "var(--brand-blue)", color: "var(--brand-blue-deep)", background: "var(--soft-blue)" }}
          >
            <Sparkles size={14} />
            <span>Demo preset: 2°C to 8°C</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {/* Min Temp */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Minimum Temperature (°C) <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              ref={minCRef}
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
              ref={maxCRef}
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
                handleChange("isDemoAssumption", false);
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
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
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
              Active maintains active temperature regulation; Passive relies on eutectic pre-chilled phase-change packs.
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
            onClick={handleSaveDraft}
          >
            <Save size={16} />
            <span>Save Draft</span>
          </button>

          <button
            type="submit"
            className="cc-btn cc-btn-primary"
            disabled={!isCityPairValid}
            style={!isCityPairValid ? { opacity: 0.6, cursor: "not-allowed" } : {}}
          >
            <span>Generate Route Analysis</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
