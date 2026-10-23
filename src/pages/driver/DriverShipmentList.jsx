import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Truck,
  Search,
  ChevronRight,
  Thermometer,
  Clock,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Navigation,
  FileText,
  RotateCcw,
  Check,
  X
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";
import ProvenanceBanner from "../../components/common/ProvenanceBanner";
import {
  openInGoogleMaps,
  getShipmentGoogleMapsUrl,
  FLAGSHIP_BANGALORE_ROUTE
} from "../../utils/googleMaps";

export default function DriverShipmentList() {
  const navigate = useNavigate();
  const { state, markTripCompleted, markTripCancelled, addToast } = useShipments();

  // 3-option status indicator: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [tripStatusTab, setTripStatusTab] = useState("ACTIVE");
  const [search, setSearch] = useState("");

  // Modal states for action triggers
  const [selectedForComplete, setSelectedForComplete] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("Mechanical reefer failure");
  const [cancellationNotes, setCancellationNotes] = useState("");

  const shipments = state.shipments || [];

  // Group shipments by the 3 status options
  const { activeTrips, completedTrips, cancelledTrips } = useMemo(() => {
    const active = [];
    const completed = [];
    const cancelled = [];

    shipments.forEach((s) => {
      const isCompleted =
        s.transitStatus === "COMPLETED" ||
        s.status === "Completed" ||
        s.status === "Accepted";

      const isCancelled =
        s.transitStatus === "CANCELLED" ||
        s.status === "Cancelled";

      if (isCancelled) {
        cancelled.push(s);
      } else if (isCompleted) {
        completed.push(s);
      } else {
        // Active trips: SCHEDULED, IN_TRANSIT, ARRIVED (prior to final signoff)
        active.push(s);
      }
    });

    return { activeTrips: active, completedTrips: completed, cancelledTrips: cancelled };
  }, [shipments]);

  // Current list based on status tab
  const currentCategoryTrips = useMemo(() => {
    switch (tripStatusTab) {
      case "COMPLETED":
        return completedTrips;
      case "CANCELLED":
        return cancelledTrips;
      case "ACTIVE":
      default:
        return activeTrips;
    }
  }, [tripStatusTab, activeTrips, completedTrips, cancelledTrips]);

  // Apply search query
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return currentCategoryTrips;

    return currentCategoryTrips.filter((s) => {
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        `${s.origin} ${s.destination}`.toLowerCase().includes(q) ||
        (s.cancellationReason && s.cancellationReason.toLowerCase().includes(q))
      );
    });
  }, [currentCategoryTrips, search]);

  // First active trip to route for "Trips to be completed" button
  const nextTripToComplete = activeTrips[0] || null;

  const handleOpenGoogleMapsForPendingTrips = () => {
    const targetUrl = openInGoogleMaps(nextTripToComplete);
    addToast("Launching Google Maps live navigation corridor...");
  };

  const handleConfirmComplete = (e) => {
    e.preventDefault();
    if (!selectedForComplete) return;

    markTripCompleted(selectedForComplete.id, {
      notes: completionNotes.trim(),
      location: `${selectedForComplete.destination} Receiving Clinic`
    });

    addToast(`Trip ${selectedForComplete.id} marked as Completed and moved to History.`);
    setSelectedForComplete(null);
    setCompletionNotes("");
  };

  const handleConfirmCancel = (e) => {
    e.preventDefault();
    if (!selectedForCancel) return;

    markTripCancelled(selectedForCancel.id, {
      reason: cancellationReason,
      notes: cancellationNotes.trim()
    });

    addToast(`Trip ${selectedForCancel.id} cancelled and archived to History.`);
    setSelectedForCancel(null);
    setCancellationNotes("");
  };

  return (
    <div className="cc-driver-page">
      <ProvenanceBanner text="Demo simulation: illustrative driver guidance environment. Telemetry and GPS corridors are simulated." />

      {/* Top Header */}
      <div className="cc-page-header">
        <div>
          <div className="cc-page-pretitle">Driver Cockpit • Fleet In-Transit Operations</div>
          <h1 className="cc-page-title">Delivery Manifests & In-Transit Guidance</h1>
          <p className="cc-page-description">
            Track real-time refrigeration telemetry, update trip progress, and navigate active corridors directly in Google Maps.
          </p>
        </div>
      </div>

      {/* Flagship Active Route Banner (Bangalore corridor from user screenshot) */}
      <div className="cc-driver-route-preview">
        <div className="cc-route-preview-info">
          <span className="cc-route-preview-badge">Next In-Transit Leg</span>
          <div className="cc-route-preview-text">
            <strong>{FLAGSHIP_BANGALORE_ROUTE.origin.split(",")[0]}</strong> → <strong>Marathahalli</strong> → <strong>Eco Space Bellandur</strong> → <strong>{FLAGSHIP_BANGALORE_ROUTE.destination.split(",")[0]}</strong>
            <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
              ({FLAGSHIP_BANGALORE_ROUTE.distanceKm} km • {FLAGSHIP_BANGALORE_ROUTE.estimatedTimeMin} min via Outer Ring Rd)
            </span>
          </div>
        </div>
        <button
          type="button"
          className="cc-route-preview-link"
          onClick={handleOpenGoogleMapsForPendingTrips}
          title="Open complete route with waypoints in Google Maps"
        >
          <Navigation size={14} /> Navigate Route in Google Maps <ExternalLink size={12} />
        </button>
      </div>

      {/* Actions and Status Indicator Bar */}
      <div className="cc-driver-top-actions">
        {/* Status Indicator matching current UI with 3 Options */}
        <div className="cc-status-indicator" role="tablist" aria-label="Trip Status Filter">
          <button
            type="button"
            className={`cc-status-btn is-active-trips ${tripStatusTab === "ACTIVE" ? "is-active" : ""}`}
            onClick={() => setTripStatusTab("ACTIVE")}
            role="tab"
            aria-selected={tripStatusTab === "ACTIVE"}
          >
            <Truck size={15} />
            <span>Active Trips</span>
            <span className="cc-status-badge-count">{activeTrips.length}</span>
          </button>

          <button
            type="button"
            className={`cc-status-btn is-completed-trips ${tripStatusTab === "COMPLETED" ? "is-active" : ""}`}
            onClick={() => setTripStatusTab("COMPLETED")}
            role="tab"
            aria-selected={tripStatusTab === "COMPLETED"}
          >
            <CheckCircle2 size={15} />
            <span>Completed Trips</span>
            <span className="cc-status-badge-count">{completedTrips.length}</span>
          </button>

          <button
            type="button"
            className={`cc-status-btn is-cancelled-trips ${tripStatusTab === "CANCELLED" ? "is-active" : ""}`}
            onClick={() => setTripStatusTab("CANCELLED")}
            role="tab"
            aria-selected={tripStatusTab === "CANCELLED"}
          >
            <XCircle size={15} />
            <span>Trips Cancelled</span>
            <span className="cc-status-badge-count">{cancelledTrips.length}</span>
          </button>
        </div>

        {/* Prominent "Trips to be completed" Google Maps Navigation Button */}
        <button
          type="button"
          className="cc-trips-complete-btn"
          onClick={handleOpenGoogleMapsForPendingTrips}
          title="Directly launch Google Maps for the active pending delivery corridor"
        >
          <Navigation size={16} />
          <span>Trips to be completed</span>
          <ExternalLink size={14} style={{ opacity: 0.9 }} />
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="cc-filter-bar">
        <div className="cc-search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} className="cc-search-icon" />
          <input
            type="search"
            className="cc-input"
            style={{ paddingLeft: 34 }}
            placeholder={`Search ${tripStatusTab.toLowerCase()} trips by ID, cargo, or corridor...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/history" className="cc-btn cc-btn-secondary cc-btn-sm">
            <FileText size={14} /> Open History & Evaluation Reports
          </Link>
        </div>
      </div>

      {/* Manifest Cards Grid */}
      <div className="cc-driver-grid">
        {filtered.length === 0 ? (
          <div className="cc-card cc-empty-box" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 24px" }}>
            {tripStatusTab === "ACTIVE" ? (
              <>
                <Truck size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No Active Trips Currently</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  All scheduled shipments have either been completed or cancelled. Check Completed Trips or History.
                </p>
              </>
            ) : tripStatusTab === "COMPLETED" ? (
              <>
                <CheckCircle2 size={36} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No Completed Trips Yet</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  Trips marked as completed will directly appear here and in the evaluation History records.
                </p>
              </>
            ) : (
              <>
                <XCircle size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No Cancelled Trips</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  No manifests have been aborted or cancelled in this session.
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((s) => {
            const minC = s.temperatureLimits?.minC ?? 2.0;
            const maxC = s.temperatureLimits?.maxC ?? 8.0;
            const currentTemp = s.currentTempC ?? 4.4;
            const isExcursion = currentTemp < minC || currentTemp > maxC;
            const status = s.transitStatus || "IN_TRANSIT";
            const mapsUrl = getShipmentGoogleMapsUrl(s);

            const isCompleted = tripStatusTab === "COMPLETED" || status === "COMPLETED";
            const isCancelled = tripStatusTab === "CANCELLED" || status === "CANCELLED";

            return (
              <div
                key={s.id}
                className="cc-card cc-driver-card"
              >
                <div className="cc-driver-card-top">
                  <div>
                    <span className="cc-mono cc-driver-id">{s.id}</span>
                    <h3 className="cc-driver-name">{s.name}</h3>
                  </div>
                  <span
                    className={`cc-badge ${
                      isCompleted
                        ? "cc-badge-recommended"
                        : isCancelled
                        ? "cc-badge-no-feasible"
                        : status === "ARRIVED"
                        ? "cc-badge-recommended"
                        : status === "IN_TRANSIT"
                        ? "cc-badge-analyzed"
                        : "cc-badge-draft"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={12} />
                    ) : isCancelled ? (
                      <XCircle size={12} />
                    ) : status === "ARRIVED" ? (
                      <CheckCircle2 size={12} />
                    ) : status === "IN_TRANSIT" ? (
                      <Truck size={12} />
                    ) : (
                      <Clock size={12} />
                    )}
                    <span>
                      {isCompleted
                        ? "Completed (History)"
                        : isCancelled
                        ? "Cancelled (History)"
                        : status === "IN_TRANSIT"
                        ? "In Transit"
                        : status === "ARRIVED"
                        ? "Arrived"
                        : "Scheduled"}
                    </span>
                  </span>
                </div>

                <div className="cc-driver-route">
                  <MapPin size={15} style={{ color: "var(--brand-blue)", flexShrink: 0 }} />
                  <span>
                    <strong>{s.origin}</strong> → <strong>{s.destination}</strong>
                  </span>
                </div>

                {/* Telemetry row */}
                <div className="cc-driver-card-telemetry">
                  <div className="cc-telemetry-col">
                    <span className="cc-telemetry-label">Compartment Temp</span>
                    <span
                      className="cc-telemetry-val cc-tabular"
                      style={{ color: isExcursion ? "var(--danger)" : "var(--brand-blue-deep)" }}
                    >
                      <Thermometer size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                      {currentTemp}°C
                    </span>
                    <span className="cc-telemetry-target">
                      Target: {minC}°C – {maxC}°C
                    </span>
                  </div>

                  <div className="cc-telemetry-col">
                    <span className="cc-telemetry-label">Status Details</span>
                    {isCompleted ? (
                      <span className="cc-telemetry-val" style={{ color: "var(--success)", fontSize: 14 }}>
                        Archived in History
                      </span>
                    ) : isCancelled ? (
                      <span className="cc-telemetry-val" style={{ color: "var(--danger)", fontSize: 13 }}>
                        {s.cancellationReason || "Cancelled"}
                      </span>
                    ) : (
                      <span className="cc-telemetry-val cc-tabular">
                        {s.transitDelayMin > 0 ? `+${s.transitDelayMin}m delay` : "On schedule"}
                      </span>
                    )}
                    <span className="cc-telemetry-target">
                      {isCompleted
                        ? `Finished ${s.completedAt ? new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}`
                        : isCancelled
                        ? `Cancelled ${s.cancelledAt ? new Date(s.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}`
                        : `Limit: ${s.maxTransitHours}h max`}
                    </span>
                  </div>
                </div>

                {/* Driver information */}
                <div className="cc-driver-card-footer">
                  <span className="cc-driver-carrier">
                    Driver: {s.assignedDriver || "Fleet Navigator"}
                  </span>
                  <button
                    type="button"
                    className="cc-btn cc-btn-ghost cc-btn-sm cc-driver-cta"
                    onClick={() => navigate(`/driver/${encodeURIComponent(s.id)}`)}
                  >
                    Open Cockpit <ChevronRight size={14} />
                  </button>
                </div>

                {/* Action Toolbar on each card */}
                <div className="cc-driver-card-actions">
                  {/* Google Maps navigation link */}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cc-card-action-btn is-maps"
                    title="Open live navigation in Google Maps"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Navigation size={13} />
                    <span>Google Maps</span>
                    <ExternalLink size={10} />
                  </a>

                  {/* Actions for Active Trips: Complete or Cancel */}
                  {!isCompleted && !isCancelled && (
                    <>
                      <button
                        type="button"
                        className="cc-card-action-btn is-complete"
                        title="Mark trip completed and move to History"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForComplete(s);
                        }}
                      >
                        <Check size={13} />
                        <span>Complete</span>
                      </button>

                      <button
                        type="button"
                        className="cc-card-action-btn is-cancel"
                        title="Cancel trip and archive to History"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForCancel(s);
                        }}
                      >
                        <X size={13} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {/* Actions for Completed or Cancelled: Direct Link to History */}
                  {(isCompleted || isCancelled) && (
                    <button
                      type="button"
                      className="cc-card-action-btn"
                      title="View audit record in History"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/history`);
                      }}
                    >
                      <FileText size={13} />
                      <span>View in History</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Mark Trip Completed */}
      {selectedForComplete && (
        <div className="cc-modal-overlay" role="dialog" aria-modal="true">
          <div className="cc-modal-card" style={{ maxWidth: 460 }}>
            <div className="cc-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
                <h2 className="cc-modal-title">Complete Delivery Trip</h2>
              </div>
              <button
                type="button"
                className="cc-modal-close-btn"
                onClick={() => setSelectedForComplete(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmComplete}>
              <div style={{ padding: "18px 20px" }}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 14 }}>
                  You are marking shipment <strong className="cc-mono">{selectedForComplete.id}</strong> ({selectedForComplete.name}) as completed. This will immediately move the manifest out of active transit and save the audit record directly into <strong>History</strong>.
                </p>

                <label className="cc-form-label" htmlFor="complete-notes-input">
                  Delivery Sign-off Notes (Optional):
                </label>
                <textarea
                  id="complete-notes-input"
                  className="cc-input"
                  style={{ width: "100%", height: 80, resize: "vertical" }}
                  placeholder="e.g. Unloaded at receiving bay, custody passed to on-duty pharmacist. Temperature intact at 4.2°C."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="cc-modal-footer">
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={() => setSelectedForComplete(null)}
                >
                  Back
                </button>
                <button type="submit" className="cc-btn cc-btn-primary" style={{ background: "var(--success)" }}>
                  <Check size={16} /> Confirm & Move to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Trip */}
      {selectedForCancel && (
        <div className="cc-modal-overlay" role="dialog" aria-modal="true">
          <div className="cc-modal-card" style={{ maxWidth: 460 }}>
            <div className="cc-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <XCircle size={20} style={{ color: "var(--danger)" }} />
                <h2 className="cc-modal-title">Cancel Delivery Trip</h2>
              </div>
              <button
                type="button"
                className="cc-modal-close-btn"
                onClick={() => setSelectedForCancel(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmCancel}>
              <div style={{ padding: "18px 20px" }}>
                <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 14 }}>
                  Cancelling trip <strong className="cc-mono">{selectedForCancel.id}</strong> will abort in-transit telemetry and archive this manifest directly to <strong>History</strong> with cancellation audit flags.
                </p>

                <div style={{ marginBottom: 14 }}>
                  <label className="cc-form-label" htmlFor="cancel-reason-select">
                    Cancellation Reason:
                  </label>
                  <select
                    id="cancel-reason-select"
                    className="cc-input"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  >
                    <option value="Mechanical reefer failure">Mechanical reefer failure</option>
                    <option value="Severe roadblock / road closed">Severe roadblock / road closed</option>
                    <option value="Vehicle mechanical breakdown">Vehicle mechanical breakdown</option>
                    <option value="Consignee hospital emergency postponement">Consignee hospital emergency postponement</option>
                    <option value="Severe thermal excursion breach">Severe thermal excursion breach</option>
                    <option value="Other operational cancellation">Other operational cancellation</option>
                  </select>
                </div>

                <div>
                  <label className="cc-form-label" htmlFor="cancel-notes-input">
                    Incident Details / Dispatch Notes:
                  </label>
                  <textarea
                    id="cancel-notes-input"
                    className="cc-input"
                    style={{ width: "100%", height: 70, resize: "vertical" }}
                    placeholder="Provide context for the cancellation..."
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="cc-modal-footer">
                <button
                  type="button"
                  className="cc-btn cc-btn-secondary"
                  onClick={() => setSelectedForCancel(null)}
                >
                  Keep Active
                </button>
                <button type="submit" className="cc-btn cc-btn-primary" style={{ background: "var(--danger)" }}>
                  <XCircle size={16} /> Confirm Cancellation & Move to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
