import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  FileText,
  MapPin,
  CheckSquare,
  Square,
  UserCheck,
  Building2
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";
import ProvenanceBanner from "../../components/common/ProvenanceBanner";
import CustodyCertificate from "../../components/receiving/CustodyCertificate";
import { evaluateThermalIntegrity } from "../../utils/mkt";

export default function ReceivingInspection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipmentById, recordDisposition, addToast } = useShipments();

  const shipment = getShipmentById(id);

  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState(
    shipment?.disposition?.status ||
      (shipment?.status === "Accepted"
        ? "ACCEPT"
        : shipment?.status === "Quarantined"
        ? "QUARANTINE"
        : shipment?.status === "Rejected"
        ? "REJECT"
        : "ACCEPT")
  );

  const [inspectorName, setInspectorName] = useState(
    shipment?.disposition?.inspectorName || "Dr. S. Kulkarni, Hospital Chief Pharmacist"
  );
  const [inspectorNotes, setInspectorNotes] = useState(
    shipment?.disposition?.notes || ""
  );

  // Integrity Checklist
  const [checklist, setChecklist] = useState({
    sealsIntact: shipment?.disposition?.criteria?.sealsIntact ?? true,
    loggerMatched: shipment?.disposition?.criteria?.loggerMatched ?? true,
    torWithinLimit: shipment?.disposition?.criteria?.torWithinLimit ?? true,
    visualNoPrecipitation: shipment?.disposition?.criteria?.visualNoPrecipitation ?? true
  });

  if (!shipment) {
    return (
      <div className="cc-receiving-inspection">
        <ProvenanceBanner text="Demo simulation: illustrative results only." />
        <div className="cc-card cc-empty-box" style={{ textAlign: "center", padding: "48px 20px" }}>
          <AlertTriangle size={36} style={{ color: "var(--warning)", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Shipment Not Found</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, marginBottom: 20 }}>
            No manifest found matching identifier "{id}".
          </p>
          <Link to="/receiving" className="cc-btn cc-btn-primary">
            <ArrowLeft size={16} /> Return to Intake Queue
          </Link>
        </div>
      </div>
    );
  }

  // Calculate thermal audit from telemetry
  const limits = {
    minC: shipment.temperatureLimits?.minC ?? 2.0,
    maxC: shipment.temperatureLimits?.maxC ?? 8.0
  };

  const thermal = evaluateThermalIntegrity(shipment.telemetry || [], limits);

  const handleToggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveDisposition = (e) => {
    e.preventDefault();

    if (!inspectorName.trim()) {
      addToast("Inspector name is required.", "error");
      return;
    }

    recordDisposition(shipment.id, {
      disposition: selectedDisposition,
      inspectorName: inspectorName.trim(),
      notes: inspectorNotes.trim(),
      criteria: checklist,
      timestamp: new Date().toISOString()
    });

    addToast(`Clinical Disposition Recorded: Batch ${selectedDisposition}`);
  };

  if (showCertificate) {
    return (
      <CustodyCertificate
        shipment={shipment}
        onBack={() => setShowCertificate(false)}
      />
    );
  }

  return (
    <div className="cc-receiving-inspection">
      <ProvenanceBanner text="Demo simulation: illustrative hospital receiving and inspection portal. Values reflect simulated thermal models." />

      {/* Top back & actions bar */}
      <div className="cc-inspection-nav">
        <Link to="/receiving" className="cc-cockpit-back-link">
          <ArrowLeft size={16} /> Return to Intake Queue
        </Link>
        <div className="cc-inspection-nav-right">
          <button
            type="button"
            className="cc-btn cc-btn-secondary cc-btn-sm"
            onClick={() => setShowCertificate(true)}
          >
            <Printer size={15} /> View & Print Certificate of Custody
          </button>
        </div>
      </div>

      {/* Manifest Overview Card */}
      <div className="cc-card cc-manifest-summary-card">
        <div className="cc-manifest-summary-left">
          <div className="cc-manifest-meta">
            <span className="cc-mono cc-manifest-id">{shipment.id}</span>
            <span className="cc-manifest-category">{shipment.category}</span>
          </div>
          <h1 className="cc-manifest-name">{shipment.name}</h1>
          <div className="cc-manifest-corridor">
            <MapPin size={16} style={{ color: "var(--brand-blue)" }} />
            <span>
              Origin: <strong>{shipment.origin}</strong> → Destination: <strong>{shipment.destination} Receiving Clinic</strong>
            </span>
          </div>
        </div>

        <div className="cc-manifest-summary-right">
          <div className="cc-manifest-stat-item">
            <span className="cc-k">Assigned Carrier:</span>
            <span className="cc-v">{shipment.assignedDriver || "Fleet Navigator"}</span>
          </div>
          <div className="cc-manifest-stat-item">
            <span className="cc-k">Container Spec:</span>
            <span className="cc-v">{shipment.container?.coolingSystem || "Active Refrigerated"} ({shipment.container?.insulation || "Moderate"})</span>
          </div>
          <div className="cc-manifest-stat-item">
            <span className="cc-k">Departure Date:</span>
            <span className="cc-v">{shipment.departureDateTime ? new Date(shipment.departureDateTime).toLocaleString() : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Grid: Thermal Integrity Evaluation & Checklist */}
      <div className="cc-inspection-grid">
        {/* Thermal Integrity & MKT Evaluation Block */}
        <div className="cc-card cc-thermal-eval-card">
          <div className="cc-card-header-row">
            <div className="cc-card-title-group">
              <Thermometer size={18} style={{ color: "var(--brand-blue)" }} />
              <h2 className="cc-section-title">Thermal Integrity & MKT Audit</h2>
            </div>
            <span
              className={`cc-badge ${
                thermal.excursionMinutes === 0
                  ? "cc-badge-recommended"
                  : "cc-badge-no-feasible"
              }`}
            >
              {thermal.excursionMinutes === 0 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              <span>{thermal.excursionMinutes === 0 ? "Meets Configured Limits" : `${thermal.excursionMinutes}m Excursion`}</span>
            </span>
          </div>

          {/* 4-Stat Metric Row */}
          <div className="cc-thermal-metric-grid">
            <div className="cc-thermal-metric-card">
              <div className="cc-metric-label">MEAN KINETIC TEMP (MKT)</div>
              <div
                className="cc-metric-value cc-tabular"
                style={{
                  color:
                    thermal.mkt !== null && (thermal.mkt < limits.minC || thermal.mkt > limits.maxC)
                      ? "var(--danger)"
                      : "var(--brand-blue-deep)"
                }}
              >
                {thermal.mkt !== null ? `${thermal.mkt.toFixed(2)}°C` : "Not evaluated"}
              </div>
              <div className="cc-metric-sub">Arrhenius (ΔH/R = 10,000 K)</div>
            </div>

            <div className="cc-thermal-metric-card">
              <div className="cc-metric-label">PERMITTED WINDOW</div>
              <div className="cc-metric-value cc-tabular">
                {limits.minC.toFixed(1)}°C – {limits.maxC.toFixed(1)}°C
              </div>
              <div className="cc-metric-sub">Configured regulatory window</div>
            </div>

            <div className="cc-thermal-metric-card">
              <div className="cc-metric-label">RECORDED RANGE</div>
              <div className="cc-metric-value cc-tabular">
                {thermal.minTemp !== null ? `${thermal.minTemp}°C – ${thermal.maxTemp}°C` : "N/A"}
              </div>
              <div className="cc-metric-sub">Avg: {thermal.avgTemp !== null ? `${thermal.avgTemp}°C` : "N/A"}</div>
            </div>

            <div className="cc-thermal-metric-card">
              <div className="cc-metric-label">TOTAL EXCURSION TIME</div>
              <div
                className="cc-metric-value cc-tabular"
                style={{ color: thermal.excursionMinutes > 0 ? "var(--danger)" : "var(--success)" }}
              >
                {thermal.excursionMinutes} min
              </div>
              <div className="cc-metric-sub">{thermal.excursions.length} breach episodes</div>
            </div>
          </div>

          {/* Thermal Finding Banner */}
          <div
            className={`cc-finding-box ${
              thermal.excursionMinutes === 0 ? "is-compliant" : "is-breached"
            }`}
          >
            <div className="cc-finding-icon">
              {thermal.excursionMinutes === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="cc-finding-content">
              <strong>Evaluation Finding: </strong>
              {thermal.excursionMinutes === 0 ? (
                <span>Meets configured limits in this simulation. Zero thermal excursion intervals detected across in-transit logger points.</span>
              ) : (
                <span>
                  Simulated thermal excursion of {thermal.excursionMinutes} minutes detected. Evaluate product stability data before accepting into active clinical inventory.
                </span>
              )}
            </div>
          </div>

          {/* Excursion Episodes List if any */}
          {thermal.excursions && thermal.excursions.length > 0 && (
            <div className="cc-excursion-table-wrap">
              <h3 className="cc-subheading">Detected Thermal Excursion Episodes</h3>
              <table className="cc-data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Peak Temp</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {thermal.excursions.map((exc, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="cc-badge cc-badge-no-feasible">
                          {exc.type === "HIGH" ? "Upper Limit Breach" : "Freeze Risk Breach"}
                        </span>
                      </td>
                      <td className="cc-tabular" style={{ fontWeight: 600, color: "var(--danger)" }}>
                        {exc.peakTemp}°C
                      </td>
                      <td className="cc-tabular">{exc.durationMinutes} min</td>
                      <td className="cc-tabular" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {new Date(exc.startTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Physical & Integrity Checklist */}
        <div className="cc-card cc-checklist-card">
          <div className="cc-card-header-row">
            <div className="cc-card-title-group">
              <CheckSquare size={18} style={{ color: "var(--brand-blue)" }} />
              <h2 className="cc-section-title">Physical Intake & Integrity Checklist</h2>
            </div>
          </div>

          <p className="cc-checklist-instruction">
            Verify each physical custody and condition criterion prior to confirming intake disposition:
          </p>

          <div className="cc-checklist-items">
            <button
              type="button"
              className={`cc-checklist-row ${checklist.sealsIntact ? "is-checked" : ""}`}
              onClick={() => handleToggleCheck("sealsIntact")}
            >
              <div className="cc-check-icon">
                {checklist.sealsIntact ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="cc-check-label">
                <strong>Tamper-evident seals intact & verified</strong>
                <span>Container latch wire seals match origin manifest serials</span>
              </div>
            </button>

            <button
              type="button"
              className={`cc-checklist-row ${checklist.loggerMatched ? "is-checked" : ""}`}
              onClick={() => handleToggleCheck("loggerMatched")}
            >
              <div className="cc-check-icon">
                {checklist.loggerMatched ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="cc-check-label">
                <strong>Data logger serial matched & retrieved</strong>
                <span>USB/BLE temperature probe serial confirmed against batch records</span>
              </div>
            </button>

            <button
              type="button"
              className={`cc-checklist-row ${checklist.torWithinLimit ? "is-checked" : ""}`}
              onClick={() => handleToggleCheck("torWithinLimit")}
            >
              <div className="cc-check-icon">
                {checklist.torWithinLimit ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="cc-check-label">
                <strong>Time Out of Refrigeration (TOR) &lt; 2 hours</strong>
                <span>Unloading and transit transfer window remained within allowable limits</span>
              </div>
            </button>

            <button
              type="button"
              className={`cc-checklist-row ${checklist.visualNoPrecipitation ? "is-checked" : ""}`}
              onClick={() => handleToggleCheck("visualNoPrecipitation")}
            >
              <div className="cc-check-icon">
                {checklist.visualNoPrecipitation ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div className="cc-check-label">
                <strong>Visual inspection: No freeze precipitation or discoloration</strong>
                <span>Vials clear of flaking, turbidity, crystallization, or physical damage</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Explicit Disposition Action Form Card */}
      <div className="cc-card cc-disposition-card">
        <div className="cc-disposition-header">
          <div className="cc-card-title-group">
            <UserCheck size={20} style={{ color: "var(--brand-blue)" }} />
            <div>
              <h2 className="cc-section-title">Clinical Intake Disposition Action</h2>
              <p className="cc-section-sub">
                Record official clinical decision into the immutable custody audit trail.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveDisposition} className="cc-disposition-form">
          {/* 3 Disposition Choice Mode Buttons */}
          <div className="cc-disposition-btn-group" role="radiogroup" aria-label="Select Clinical Disposition">
            <button
              type="button"
              role="radio"
              aria-checked={selectedDisposition === "ACCEPT"}
              className={`cc-disposition-btn is-accept ${selectedDisposition === "ACCEPT" ? "is-active" : ""}`}
              onClick={() => setSelectedDisposition("ACCEPT")}
            >
              <div className="cc-disp-radio-indicator" />
              <CheckCircle2 size={20} className="cc-disp-icon" />
              <div className="cc-disp-text">
                <span className="cc-disp-title">ACCEPT BATCH</span>
                <span className="cc-disp-desc">Approved under inspection criteria into active hospital cold stock</span>
              </div>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedDisposition === "QUARANTINE"}
              className={`cc-disposition-btn is-quarantine ${selectedDisposition === "QUARANTINE" ? "is-active" : ""}`}
              onClick={() => setSelectedDisposition("QUARANTINE")}
            >
              <div className="cc-disp-radio-indicator" />
              <AlertTriangle size={20} className="cc-disp-icon" />
              <div className="cc-disp-text">
                <span className="cc-disp-title">HOLD IN QUARANTINE</span>
                <span className="cc-disp-desc">Held in 2°C–8°C isolation pending QA stability review / manufacturer clearance</span>
              </div>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={selectedDisposition === "REJECT"}
              className={`cc-disposition-btn is-reject ${selectedDisposition === "REJECT" ? "is-active" : ""}`}
              onClick={() => setSelectedDisposition("REJECT")}
            >
              <div className="cc-disp-radio-indicator" />
              <XCircle size={20} className="cc-disp-icon" />
              <div className="cc-disp-text">
                <span className="cc-disp-title">REJECT BATCH</span>
                <span className="cc-disp-desc">Critical cold-chain breach confirmed; marked for quarantine return/destruction</span>
              </div>
            </button>
          </div>

          {/* Form Fields: Inspector name and clinical notes */}
          <div className="cc-form-grid-2" style={{ marginTop: 20 }}>
            <div>
              <label className="cc-form-label" htmlFor="inspector-name">
                Inspector Name & Official Credential:
              </label>
              <input
                id="inspector-name"
                type="text"
                className="cc-input"
                style={{ width: "100%" }}
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="e.g., Dr. S. Kulkarni, Chief Pharmacist"
                required
              />
            </div>

            <div>
              <label className="cc-form-label" htmlFor="inspection-notes">
                Clinical Disposition Notes & Stability Remarks:
              </label>
              <input
                id="inspection-notes"
                type="text"
                className="cc-input"
                style={{ width: "100%" }}
                value={inspectorNotes}
                onChange={(e) => setInspectorNotes(e.target.value)}
                placeholder="e.g., Tamper seals intact. MKT 4.6°C within stability budget."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="cc-disposition-actions">
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => setShowCertificate(true)}
            >
              <Printer size={16} /> Preview Custody Certificate
            </button>

            <button type="submit" className="cc-btn cc-btn-primary">
              <ShieldCheck size={16} /> Save Official Disposition & Update Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
