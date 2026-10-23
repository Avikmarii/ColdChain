import React from "react";
import { Printer, ShieldCheck, AlertTriangle, XCircle, ArrowLeft, CheckCircle2, FileText, Thermometer } from "lucide-react";
import { evaluateThermalIntegrity } from "../../utils/mkt";

export default function CustodyCertificate({ shipment, onBack }) {
  if (!shipment) return null;

  const limits = {
    minC: shipment.temperatureLimits?.minC ?? 2.0,
    maxC: shipment.temperatureLimits?.maxC ?? 8.0
  };

  const thermal = evaluateThermalIntegrity(shipment.telemetry || [], limits);
  const disposition = shipment.disposition || {
    status: shipment.status === "Accepted" ? "ACCEPT" : shipment.status === "Rejected" ? "REJECT" : "PENDING",
    inspectorName: "Clinic Receiving Officer",
    inspectedAt: new Date().toISOString(),
    notes: "Default inspection record"
  };

  const isAccepted = disposition.status === "ACCEPT" || shipment.status === "Accepted";
  const isQuarantined = disposition.status === "QUARANTINE" || shipment.status === "Quarantined";
  const isRejected = disposition.status === "REJECT" || shipment.status === "Rejected";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cc-certificate-wrapper">
      {/* On-screen action toolbar - hidden when printing */}
      <div className="cc-certificate-actions no-print">
        <button type="button" className="cc-btn cc-btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Inspection Portal
        </button>
        <button type="button" className="cc-btn cc-btn-primary" onClick={handlePrint}>
          <Printer size={16} /> Print / Save PDF Certificate
        </button>
      </div>

      {/* Official Single-Page Certificate Document */}
      <div className="cc-certificate-sheet" id="custody-certificate">
        {/* Certificate Header */}
        <header className="cc-cert-header">
          <div className="cc-cert-brand">
            <div className="cc-cert-symbol">❄</div>
            <div>
              <div className="cc-cert-org">COLDCHAIN CLINICAL INTELLIGENCE NETWORK</div>
              <h1 className="cc-cert-title">Certificate of Cold-Chain Custody & In-Transit Thermal Verification</h1>
            </div>
          </div>
          <div className="cc-cert-serial">
            <div className="cc-cert-serial-label">CERTIFICATE SERIAL</div>
            <div className="cc-cert-serial-code">CERT-{shipment.id}-{new Date().getFullYear()}</div>
            <div className="cc-cert-issue-date">Issued: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
          </div>
        </header>

        {/* Required Universal Banner */}
        <div className="cc-cert-banner">
          Demo simulation: illustrative results only. Thermal values derived from simulated corridor conditions.
        </div>

        {/* Manifest Section */}
        <section className="cc-cert-section">
          <h2 className="cc-cert-section-title">1. Shipment Manifest & Cargo Specification</h2>
          <div className="cc-cert-grid-4">
            <div className="cc-cert-field">
              <span className="cc-cert-k">Shipment Identifier:</span>
              <span className="cc-cert-v cc-mono">{shipment.id}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Cargo Name:</span>
              <span className="cc-cert-v">{shipment.name}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Category:</span>
              <span className="cc-cert-v">{shipment.category}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Assigned Carrier:</span>
              <span className="cc-cert-v">{shipment.assignedDriver || "Fleet Navigator (Assigned)"}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Origin Dispatch Hub:</span>
              <span className="cc-cert-v">{shipment.origin}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Destination Facility:</span>
              <span className="cc-cert-v">{shipment.destination}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Departure Time:</span>
              <span className="cc-cert-v">{shipment.departureDateTime ? new Date(shipment.departureDateTime).toLocaleString() : "Not specified"}</span>
            </div>
            <div className="cc-cert-field">
              <span className="cc-cert-k">Packaging / Insulation:</span>
              <span className="cc-cert-v">{shipment.container?.coolingSystem || "Active Refrigerated"} ({shipment.container?.insulation || "Moderate"})</span>
            </div>
          </div>
        </section>

        {/* Thermal Audit & Telemetry Section */}
        <section className="cc-cert-section">
          <h2 className="cc-cert-section-title">2. In-Transit Thermal Integrity & MKT Evaluation</h2>
          <div className="cc-cert-thermal-summary">
            <div className="cc-cert-stat">
              <div className="cc-cert-stat-label">CONFIGURED BAND</div>
              <div className="cc-cert-stat-val cc-tabular">{limits.minC.toFixed(1)}°C – {limits.maxC.toFixed(1)}°C</div>
              <div className="cc-cert-stat-sub">Strict WHO / USP limits</div>
            </div>
            <div className="cc-cert-stat">
              <div className="cc-cert-stat-label">MEAN KINETIC TEMP (MKT)</div>
              <div className="cc-cert-stat-val cc-tabular" style={{ color: thermal.mkt != null && (thermal.mkt < limits.minC || thermal.mkt > limits.maxC) ? "var(--danger)" : "var(--brand-blue-deep)" }}>
                {thermal.mkt !== null ? `${thermal.mkt.toFixed(2)}°C` : "Not evaluated"}
              </div>
              <div className="cc-cert-stat-sub">Arrhenius (ΔH/R = 10,000 K)</div>
            </div>
            <div className="cc-cert-stat">
              <div className="cc-cert-stat-label">MIN / MAX RECORDED</div>
              <div className="cc-cert-stat-val cc-tabular">
                {thermal.minTemp !== null ? `${thermal.minTemp}°C / ${thermal.maxTemp}°C` : "N/A"}
              </div>
              <div className="cc-cert-stat-sub">Avg: {thermal.avgTemp !== null ? `${thermal.avgTemp}°C` : "N/A"}</div>
            </div>
            <div className="cc-cert-stat">
              <div className="cc-cert-stat-label">CUMULATIVE EXCURSIONS</div>
              <div className="cc-cert-stat-val cc-tabular" style={{ color: thermal.excursionMinutes > 0 ? "var(--danger)" : "var(--success)" }}>
                {thermal.excursionMinutes} min
              </div>
              <div className="cc-cert-stat-sub">{thermal.excursions.length} breach events</div>
            </div>
          </div>

          <div className="cc-cert-eval-banner">
            <strong>Thermal Audit Finding: </strong>
            {thermal.excursionMinutes === 0 ? (
              <span>Meets configured limits in this simulation. No cumulative thermal excursions detected across transit logger telemetry points.</span>
            ) : (
              <span>Cumulative excursion of {thermal.excursionMinutes} minutes outside configured {limits.minC}°C – {limits.maxC}°C threshold recorded during transit. Special disposition required.</span>
            )}
          </div>
        </section>

        {/* Clinical Receiving Disposition Section */}
        <section className="cc-cert-section">
          <h2 className="cc-cert-section-title">3. Receiving Hospital Inspection & Clinical Disposition</h2>
          <div className="cc-cert-disposition-block">
            <div className="cc-cert-disposition-badge-wrap">
              {isAccepted && (
                <div className="cc-cert-disposition-stamp is-accepted">
                  <CheckCircle2 size={24} />
                  <span>ACCEPTED INTO CLINIC STOCK</span>
                </div>
              )}
              {isQuarantined && (
                <div className="cc-cert-disposition-stamp is-quarantined">
                  <AlertTriangle size={24} />
                  <span>HELD IN QUARANTINE / QA REVIEW</span>
                </div>
              )}
              {isRejected && (
                <div className="cc-cert-disposition-stamp is-rejected">
                  <XCircle size={24} />
                  <span>REJECTED - RETURN TO SENDER</span>
                </div>
              )}
              {!isAccepted && !isQuarantined && !isRejected && (
                <div className="cc-cert-disposition-stamp is-pending">
                  <FileText size={24} />
                  <span>INSPECTION PENDING</span>
                </div>
              )}
            </div>

            <div className="cc-cert-disposition-details">
              <div className="cc-cert-field">
                <span className="cc-cert-k">Inspector Name & Credential:</span>
                <span className="cc-cert-v">{disposition.inspectorName || "Clinic Receiving Pharmacist / QA"}</span>
              </div>
              <div className="cc-cert-field">
                <span className="cc-cert-k">Inspection Timestamp:</span>
                <span className="cc-cert-v">{new Date(disposition.inspectedAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="cc-cert-field" style={{ gridColumn: "1 / -1" }}>
                <span className="cc-cert-k">Clinical Inspection & Disposition Notes:</span>
                <span className="cc-cert-v">{disposition.notes || "Packaging seals intact. Thermal logger read and verified against allowable temperature thresholds."}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Chain of Custody Signatures Section */}
        <section className="cc-cert-section">
          <h2 className="cc-cert-section-title">4. Chain of Custody Attestation & Signatures</h2>
          <div className="cc-cert-signatures-grid">
            <div className="cc-cert-signature-box">
              <div className="cc-cert-sig-role">Dispatch Pharmacist</div>
              <div className="cc-cert-sig-line">Dr. P. Sharma (Verified Dispatch)</div>
              <div className="cc-cert-sig-sub">Origin Dispatch Verification</div>
              <div className="cc-cert-sig-date">{shipment.departureDateTime ? new Date(shipment.departureDateTime).toLocaleDateString() : new Date().toLocaleDateString()}</div>
            </div>

            <div className="cc-cert-signature-box">
              <div className="cc-cert-sig-role">In-Transit Carrier / Driver</div>
              <div className="cc-cert-sig-line">{shipment.assignedDriver || "Fleet Driver Custody Verified"}</div>
              <div className="cc-cert-sig-sub">Vehicle Reefer #RF-402</div>
              <div className="cc-cert-sig-date">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="cc-cert-signature-box">
              <div className="cc-cert-sig-role">Receiving QA / Clinical Pharmacist</div>
              <div className="cc-cert-sig-line">{disposition.inspectorName || "Authorized Clinical Signatory"}</div>
              <div className="cc-cert-sig-sub">{shipment.destination} Receiving Clinic</div>
              <div className="cc-cert-sig-date">{new Date(disposition.inspectedAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="cc-cert-footer">
          <div>
            Security Hash: SHA256:{shipment.id.toLowerCase()}-audit-sim-{new Date().getFullYear()} • Validated against cold-chain protocol annex 4.
          </div>
          <div className="cc-cert-page-num">
            Page 1 of 1 • Single-Page Certified Custody Record
          </div>
        </footer>
      </div>
    </div>
  );
}
