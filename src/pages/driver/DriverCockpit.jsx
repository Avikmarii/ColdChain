import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Truck,
  ArrowLeft,
  Thermometer,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  PlusCircle,
  RotateCcw,
  QrCode,
  FileText,
  Radio,
  Flame,
  Snowflake,
  ExternalLink,
  Navigation,
  Check,
  X
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";
import ProvenanceBanner from "../../components/common/ProvenanceBanner";
import { openInGoogleMaps, getShipmentGoogleMapsUrl, FLAGSHIP_BANGALORE_ROUTE } from "../../utils/googleMaps";

export default function DriverCockpit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getShipmentById,
    recordDriverIncident,
    updateTransitStatus,
    markTripCompleted,
    markTripCancelled,
    addToast
  } = useShipments();

  const shipment = getShipmentById(id);

  const [customNote, setCustomNote] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("Mechanical reefer failure");
  const [cancellationNotes, setCancellationNotes] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  if (!shipment) {
    return (
      <div className="cc-driver-cockpit">
        <ProvenanceBanner text="Demo simulation: illustrative results only." />
        <div className="cc-card cc-empty-box" style={{ textAlign: "center", padding: "48px 20px" }}>
          <AlertTriangle size={36} style={{ color: "var(--warning)", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Shipment Not Found</h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, marginBottom: 20 }}>
            No manifest found matching identifier "{id}".
          </p>
          <Link to="/driver" className="cc-btn cc-btn-primary">
            <ArrowLeft size={16} /> Return to Manifest List
          </Link>
        </div>
      </div>
    );
  }

  const minC = shipment.temperatureLimits?.minC ?? 2.0;
  const maxC = shipment.temperatureLimits?.maxC ?? 8.0;
  const currentTemp = shipment.currentTempC ?? 4.4;
  const isExcursion = currentTemp < minC || currentTemp > maxC;
  const transitStatus = shipment.transitStatus || "IN_TRANSIT";
  const progressPct = shipment.progressPct ?? 65;
  const delayMin = shipment.transitDelayMin || 0;

  // Incident trigger handlers
  const handleTriggerIncident = (type, label, tempDeltaC, delayMinutes, defaultNote = "") => {
    recordDriverIncident(shipment.id, {
      type,
      label,
      tempDeltaC,
      delayMinutes,
      notes: defaultNote,
      timestamp: new Date().toISOString()
    });

    addToast(`Driver Event Logged: ${label}`);
  };

  const handleCustomNoteSubmit = (e) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    recordDriverIncident(shipment.id, {
      type: "NOTE",
      label: "Driver Observation Note",
      tempDeltaC: 0,
      delayMinutes: 0,
      notes: customNote.trim(),
      timestamp: new Date().toISOString()
    });

    setCustomNote("");
    setShowCustomModal(false);
    addToast("Driver note logged to manifest activity.");
  };

  const handleCompleteHandover = () => {
    updateTransitStatus(shipment.id, {
      transitStatus: "ARRIVED",
      progressPct: 100,
      currentLocation: `${shipment.destination} Receiving Bay`
    });

    addToast("Handover pass activated! Arrived at Receiving Clinic.");
    setShowHandoverModal(false);
    navigate(`/receiving/${encodeURIComponent(shipment.id)}`);
  };

  // Temperature meter needle position (scale: 0C = 0%, 12C = 100%)
  const clampedTemp = Math.max(0, Math.min(12, currentTemp));
  const meterPct = (clampedTemp / 12) * 100;
  const minPosPct = (minC / 12) * 100;
  const maxPosPct = (maxC / 12) * 100;

  return (
    <div className="cc-driver-cockpit">
      <ProvenanceBanner text="Demo simulation: illustrative driver guidance environment. Telemetry and incident spikes are simulated." />

      {/* Top back bar */}
      <div className="cc-cockpit-nav">
        <Link to="/driver" className="cc-cockpit-back-link">
          <ArrowLeft size={16} /> All Delivery Manifests
        </Link>
        <div className="cc-cockpit-nav-right">
          <span className="cc-live-indicator">
            <Radio size={14} className="cc-pulse-icon" /> Live Cockpit Telemetry
          </span>
          <button
            type="button"
            className="cc-btn cc-btn-sm cc-btn-secondary"
            onClick={() => setShowHandoverModal(true)}
          >
            <QrCode size={14} /> Custody Handover Pass
          </button>
        </div>
      </div>

      {/* Primary Mobile-First Header Card */}
      <div className="cc-card cc-cockpit-header-card">
        <div className="cc-cockpit-header-main">
          <div className="cc-cockpit-ids">
            <span className="cc-mono cc-cockpit-id">{shipment.id}</span>
            <span className="cc-cockpit-category">{shipment.category}</span>
          </div>
          <h1 className="cc-cockpit-title">{shipment.name}</h1>
          <div className="cc-cockpit-route-corridor">
            <MapPin size={16} style={{ color: "var(--brand-blue)", flexShrink: 0 }} />
            <span>
              <strong>{shipment.origin}</strong> to <strong>{shipment.destination}</strong>
            </span>
          </div>
        </div>

        <div className="cc-cockpit-driver-badge">
          <div className="cc-cockpit-driver-label">ASSIGNED VEHICLE & DRIVER</div>
          <div className="cc-cockpit-driver-name">{shipment.assignedDriver || "Fleet Navigator (Assigned)"}</div>
          <div className="cc-cockpit-driver-sub">Reefer Unit: Carrier Transicold 35X • GPS: Simulated Corridor</div>
        </div>
      </div>

      {/* Grid: Temperature Gauge & Route Progress */}
      <div className="cc-cockpit-grid">
        {/* Real-time Compartment Temperature Gauge */}
        <div className="cc-card cc-gauge-card">
          <div className="cc-gauge-header">
            <div className="cc-gauge-title-wrap">
              <Thermometer size={18} style={{ color: isExcursion ? "var(--danger)" : "var(--brand-blue)" }} />
              <h2 className="cc-gauge-title">Compartment Refrigeration</h2>
            </div>
            <span
              className={`cc-badge ${
                isExcursion ? "cc-badge-no-feasible" : "cc-badge-recommended"
              }`}
            >
              {isExcursion ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
              <span>{isExcursion ? "Excursion Warning" : "Meets Configured Limits"}</span>
            </span>
          </div>

          {/* Large Tabular Temperature Display */}
          <div className="cc-gauge-readout-block">
            <div
              className="cc-gauge-temp cc-tabular"
              style={{ color: isExcursion ? "var(--danger)" : "var(--brand-blue-deep)" }}
            >
              {currentTemp.toFixed(1)}°C
            </div>
            <div className="cc-gauge-limit-info">
              Configured Range: <strong>{minC.toFixed(1)}°C – {maxC.toFixed(1)}°C</strong>
              <div className="cc-gauge-subtext">
                {isExcursion
                  ? `Deviation of ${(currentTemp > maxC ? currentTemp - maxC : minC - currentTemp).toFixed(1)}°C outside acceptable window.`
                  : "Continuous cooling active. Thermal stability within target."}
              </div>
            </div>
          </div>

          {/* Temperature Visual Meter Bar */}
          <div className="cc-meter-container" aria-label={`Temperature meter showing ${currentTemp} degrees Celsius`}>
            <div className="cc-meter-track">
              {/* Permitted Band highlight */}
              <div
                className="cc-meter-permitted-zone"
                style={{
                  left: `${minPosPct}%`,
                  width: `${maxPosPct - minPosPct}%`
                }}
                title={`Target Window: ${minC}°C - ${maxC}°C`}
              />
              {/* Current Temperature Indicator Needle */}
              <div
                className={`cc-meter-needle ${isExcursion ? "is-excursion" : ""}`}
                style={{ left: `${meterPct}%` }}
                title={`Current: ${currentTemp}°C`}
              >
                <div className="cc-meter-needle-head" />
                <div className="cc-meter-needle-label cc-tabular">{currentTemp}°C</div>
              </div>
            </div>

            <div className="cc-meter-labels">
              <span>0°C (Freeze Risk)</span>
              <span className="cc-meter-label-mid">2°C – 8°C (Compliant)</span>
              <span>12°C+ (Ambient)</span>
            </div>
          </div>

          {/* Telemetry provenance footer */}
          <div className="cc-gauge-footer">
            <span>Sensor: Digital PT100 Probe A1 (Simulated)</span>
            <span>Interval: 15 min updates</span>
          </div>
        </div>

        {/* Route Adherence & Transit Status Timeline */}
        <div className="cc-card cc-adherence-card">
          <div className="cc-adherence-header">
            <div className="cc-adherence-title-wrap">
              <Clock size={18} style={{ color: "var(--brand-blue)" }} />
              <h2 className="cc-adherence-title">Route Adherence & Schedule</h2>
            </div>
            <span
              className={`cc-badge ${
                transitStatus === "ARRIVED"
                  ? "cc-badge-recommended"
                  : delayMin > 30
                  ? "cc-badge-no-feasible"
                  : "cc-badge-analyzed"
              }`}
            >
              {delayMin > 0 ? `Delay: +${delayMin}m` : "On Schedule"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="cc-progress-block">
            <div className="cc-progress-meta">
              <span className="cc-progress-status-text">
                Status: <strong>{transitStatus === "ARRIVED" ? "Arrived at Destination" : "In-Transit Highway Corridor"}</strong>
              </span>
              <span className="cc-progress-pct cc-tabular">{progressPct}% Traversed</span>
            </div>
            <div className="cc-progress-track">
              <div
                className="cc-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Transit Milestones Waypoint Stepper */}
          <div className="cc-milestone-stepper">
            <div className={`cc-milestone-step ${progressPct >= 10 ? "is-complete" : "is-active"}`}>
              <div className="cc-milestone-dot">1</div>
              <div className="cc-milestone-content">
                <div className="cc-milestone-name">{shipment.origin} Dispatch Hub</div>
                <div className="cc-milestone-time">Departed: {shipment.departureDateTime ? new Date(shipment.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "09:00 AM"}</div>
              </div>
            </div>

            <div className={`cc-milestone-step ${progressPct >= 60 ? "is-complete" : progressPct >= 25 ? "is-active" : ""}`}>
              <div className="cc-milestone-dot">2</div>
              <div className="cc-milestone-content">
                <div className="cc-milestone-name">Highway Corridor Toll Checkpoint</div>
                <div className="cc-milestone-time">Seal checked • Reefer active</div>
              </div>
            </div>

            <div className={`cc-milestone-step ${progressPct >= 100 ? "is-complete" : progressPct >= 75 ? "is-active" : ""}`}>
              <div className="cc-milestone-dot">3</div>
              <div className="cc-milestone-content">
                <div className="cc-milestone-name">{shipment.destination} Receiving Clinic</div>
                <div className="cc-milestone-time">
                  {transitStatus === "ARRIVED" ? "Arrived at Bay" : `Estimated arrival in ${Math.max(1, shipment.maxTransitHours - 2)}h`}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Handover CTA */}
          <div className="cc-adherence-footer">
            <button
              type="button"
              className="cc-btn cc-btn-primary cc-btn-sm"
              style={{ width: "100%" }}
              onClick={() => setShowHandoverModal(true)}
            >
              <QrCode size={15} /> Open Custody Handover Verification Pass
            </button>
          </div>
        </div>
      </div>

      {/* Incident Simulation & Driver Log Triggers */}
      <div className="cc-card cc-incidents-card">
        <div className="cc-incidents-header">
          <div>
            <h2 className="cc-incidents-title">Incident Simulation & In-Transit Telemetry Triggers</h2>
            <p className="cc-incidents-desc">
              Test how real-time en-route disruptions ripple immediately through the Logistics Manager analysis and Receiving Hospital inspection portal.
            </p>
          </div>
          <button
            type="button"
            className="cc-btn cc-btn-secondary cc-btn-sm"
            onClick={() => setShowCustomModal(true)}
          >
            <PlusCircle size={15} /> Add Custom Driver Note
          </button>
        </div>

        {/* Action Button Grid */}
        <div className="cc-trigger-btn-grid">
          <button
            type="button"
            className="cc-trigger-btn cc-trigger-delay"
            onClick={() =>
              handleTriggerIncident(
                "DELAY",
                "Traffic Congestion on Highway (+30m)",
                0,
                30,
                "Heavy toll queue bottleneck; expected delay 30 minutes"
              )
            }
          >
            <div className="cc-trigger-icon-wrap" style={{ background: "var(--warning-pale)", color: "var(--warning)" }}>
              <Clock size={18} />
            </div>
            <div className="cc-trigger-info">
              <span className="cc-trigger-name">Report Traffic Delay (+30m)</span>
              <span className="cc-trigger-sub">Adds 30 min to transit time</span>
            </div>
          </button>

          <button
            type="button"
            className="cc-trigger-btn cc-trigger-delay-heavy"
            onClick={() =>
              handleTriggerIncident(
                "DELAY",
                "Highway Roadblock Diversion (+60m)",
                0,
                60,
                "Accident detour on state highway; transit extended 1 hour"
              )
            }
          >
            <div className="cc-trigger-icon-wrap" style={{ background: "var(--danger-pale)", color: "var(--danger)" }}>
              <AlertTriangle size={18} />
            </div>
            <div className="cc-trigger-info">
              <span className="cc-trigger-name">Report Severe Delay (+60m)</span>
              <span className="cc-trigger-sub">Detour diversion / severe jam</span>
            </div>
          </button>

          <button
            type="button"
            className="cc-trigger-btn cc-trigger-excursion"
            onClick={() =>
              handleTriggerIncident(
                "REEFER_SPIKE",
                "Refrigeration Door Glitch (+3.5°C Excursion)",
                3.5,
                0,
                "Brief power drop in compressor; compartment temperature spiked"
              )
            }
          >
            <div className="cc-trigger-icon-wrap" style={{ background: "var(--danger-pale)", color: "var(--danger)" }}>
              <Flame size={18} />
            </div>
            <div className="cc-trigger-info">
              <span className="cc-trigger-name">Simulate Reefer Spike (+3.5°C)</span>
              <span className="cc-trigger-sub">Triggers excursion above 8.0°C</span>
            </div>
          </button>

          <button
            type="button"
            className="cc-trigger-btn cc-trigger-restore"
            onClick={() =>
              handleTriggerIncident(
                "REEFER_RESTORED",
                "Refrigeration Restored (-3.0°C Return)",
                -3.0,
                0,
                "Auxiliary cooling unit engaged; temperature pulled back into target band"
              )
            }
          >
            <div className="cc-trigger-icon-wrap" style={{ background: "var(--success-pale)", color: "var(--success)" }}>
              <Snowflake size={18} />
            </div>
            <div className="cc-trigger-info">
              <span className="cc-trigger-name">Restore Cooling (-3.0°C)</span>
              <span className="cc-trigger-sub">Returns compartment to 2°C–8°C</span>
            </div>
          </button>
        </div>

        {/* Incident History Stream for this Shipment */}
        <div className="cc-incident-stream-wrap">
          <h3 className="cc-incident-stream-title">Recorded In-Transit Incident Events ({shipment.incidents?.length || 0})</h3>
          {shipment.incidents && shipment.incidents.length > 0 ? (
            <div className="cc-incident-stream">
              {shipment.incidents.map((inc) => (
                <div key={inc.id} className="cc-incident-item">
                  <div className="cc-incident-time cc-tabular">
                    {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="cc-incident-badge">
                    <span
                      className={`cc-badge ${
                        inc.tempDeltaC > 0 || inc.type === "REEFER_SPIKE"
                          ? "cc-badge-no-feasible"
                          : inc.type === "REEFER_RESTORED"
                          ? "cc-badge-recommended"
                          : "cc-badge-draft"
                      }`}
                    >
                      {inc.label}
                    </span>
                  </div>
                  <div className="cc-incident-notes">{inc.notes || "Driver status update logged"}</div>
                  <span className="cc-provenance-tag">user-reported</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="cc-incident-empty">
              No incidents reported yet for this manifest. Use the simulation buttons above to test in-transit conditions.
            </div>
          )}
        </div>
      </div>

      {/* Custody Handover Pass Modal */}
      {showHandoverModal && (
        <div className="cc-modal-overlay" role="dialog" aria-modal="true">
          <div className="cc-modal-card cc-handover-modal">
            <div className="cc-handover-header">
              <div className="cc-handover-brand">
                <ShieldCheck size={24} style={{ color: "var(--brand-blue)" }} />
                <div>
                  <h2 className="cc-handover-title">Digital Custody Handover Pass</h2>
                  <div className="cc-handover-sub">Dynamic driver-to-clinic chain of custody credential</div>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close-btn"
                onClick={() => setShowHandoverModal(false)}
                aria-label="Close handover pass"
              >
                ✕
              </button>
            </div>

            <div className="cc-handover-body">
              {/* Token Display */}
              <div className="cc-handover-token-box">
                <div className="cc-handover-qr-placeholder">
                  {/* Stylized QR placeholder */}
                  <div className="cc-qr-code-grid">
                    <div className="cc-qr-corner" />
                    <div className="cc-qr-corner cc-qr-tr" />
                    <div className="cc-qr-corner cc-qr-bl" />
                    <div className="cc-qr-center-icon">
                      <Truck size={20} />
                    </div>
                  </div>
                  <span className="cc-qr-token-text cc-mono">TOKEN: CC-VERIFY-{shipment.id}</span>
                </div>

                <div className="cc-handover-meta">
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Shipment Identifier:</span>
                    <span className="cc-v cc-mono">{shipment.id}</span>
                  </div>
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Product Name:</span>
                    <span className="cc-v">{shipment.name}</span>
                  </div>
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Carrier / Driver:</span>
                    <span className="cc-v">{shipment.assignedDriver || "Fleet Navigator"}</span>
                  </div>
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Current Temperature:</span>
                    <span
                      className="cc-v cc-tabular"
                      style={{ color: isExcursion ? "var(--danger)" : "var(--brand-blue-deep)", fontWeight: 600 }}
                    >
                      {currentTemp.toFixed(1)}°C ({isExcursion ? "Excursion Logged" : "Within 2°C–8°C"})
                    </span>
                  </div>
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Container Seals:</span>
                    <span className="cc-v" style={{ color: "var(--success)", fontWeight: 600 }}>Tamper Seals Intact</span>
                  </div>
                  <div className="cc-handover-meta-row">
                    <span className="cc-k">Destination Clinic:</span>
                    <span className="cc-v">{shipment.destination} Receiving Clinic</span>
                  </div>
                </div>
              </div>

              <div className="cc-handover-callout">
                Present this digital custody pass to the receiving pharmacist upon arrival at the unloading bay. Clicking below marks shipment arrived and opens the receiving inspection checklist.
              </div>
            </div>

            <div className="cc-modal-footer">
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={() => setShowHandoverModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cc-btn cc-btn-primary"
                onClick={handleCompleteHandover}
              >
                <CheckCircle2 size={16} /> Arrive & Open Hospital Receiving Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Note Modal */}
      {showCustomModal && (
        <div className="cc-modal-overlay" role="dialog" aria-modal="true">
          <div className="cc-modal-card" style={{ maxWidth: 440 }}>
            <div className="cc-modal-header">
              <h2 className="cc-modal-title">Log Custom In-Transit Note</h2>
              <button
                type="button"
                className="cc-modal-close-btn"
                onClick={() => setShowCustomModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomNoteSubmit}>
              <div style={{ padding: "16px 20px" }}>
                <label className="cc-form-label" htmlFor="driver-note-input">
                  Driver Observation or Waypoint Check:
                </label>
                <textarea
                  id="driver-note-input"
                  className="cc-input"
                  style={{ width: "100%", height: 90, resize: "vertical" }}
                  placeholder="e.g., Highway toll inspection passed; cargo door stayed sealed. Ambient temp 34°C outside."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="cc-modal-footer">
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="cc-btn cc-btn-primary">
                  Save to Manifest Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
