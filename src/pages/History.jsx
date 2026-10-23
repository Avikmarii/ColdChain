import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  UploadCloud,
  X
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import { PRODUCT_CATEGORIES } from "../data/demoRoutes";
import { api } from "../services/api";
import ImportChest from "../components/history/ImportChest";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import ProvenanceBanner from "../components/common/ProvenanceBanner";

export default function History() {
  const navigate = useNavigate();
  const { state, showToast, refreshShipments } = useShipments();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Mobile import accordion
  const [isMobileImportOpen, setIsMobileImportOpen] = useState(false);

  // Import feedback state
  const [importFeedback, setImportFeedback] = useState(null); // { message, skippedRows: [] }
  const [showClearImportedModal, setShowClearImportedModal] = useState(false);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return state.shipments.filter((s) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        `${s.origin} to ${s.destination}`.toLowerCase().includes(q);

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        s.status === statusFilter ||
        (statusFilter === "Completed" && (s.transitStatus === "COMPLETED" || s.status === "Completed" || s.status === "Accepted")) ||
        (statusFilter === "Cancelled" && (s.transitStatus === "CANCELLED" || s.status === "Cancelled")) ||
        (statusFilter === "In Transit" && (s.transitStatus === "IN_TRANSIT" || s.status === "In Transit"));

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [state.shipments, searchQuery, statusFilter, categoryFilter]);

  const hasImportedRecords = state.shipments.some((s) => s.source === "imported");

  const handleExportCsv = async () => {
    try {
      await api.exportCsv();
      showToast("CSV Exported", `Downloaded ${state.shipments.length} shipment records`, "success");
    } catch (err) {
      showToast("Export Failed", err.message || "Could not generate CSV file", "error");
    }
  };

  const handleFileLoaded = async (fileContent, readError, onDone) => {
    if (readError) {
      setImportFeedback({ error: readError, skippedRows: [] });
      showToast("Import Failed", readError, "error");
      onDone?.({ success: false });
      return;
    }

    try {
      const res = await api.importCsv(fileContent);
      const { insertedCount, skippedCount, skippedRows } = res.data || {};
      await refreshShipments();

      setImportFeedback({
        error: null,
        count: insertedCount || 0,
        skippedRows: skippedRows || []
      });

      const summaryMsg = `Imported ${insertedCount || 0} records${
        skippedRows && skippedRows.length > 0 ? `, skipped ${skippedRows.length}` : ""
      }`;

      showToast(
        (insertedCount || 0) > 0 ? "Import Complete" : "No Records Imported",
        summaryMsg,
        (insertedCount || 0) > 0 ? "success" : "warning"
      );

      onDone?.({ success: (insertedCount || 0) > 0, count: insertedCount || 0 });
    } catch (err) {
      setImportFeedback({ error: err.message || "Failed to import CSV", skippedRows: [] });
      showToast("Import Rejected", err.message || "Import failed", "error");
      onDone?.({ success: false });
    }
  };

  const handleClearImported = async () => {
    try {
      await api.deleteImportedRecords();
      await refreshShipments();
      setShowClearImportedModal(false);
      showToast("Imported Records Removed", "Cleaned external user-imported rows", "info");
    } catch (err) {
      showToast("Removal Failed", err.message || "Failed to remove imported records", "error");
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  };

  return (
    <div>
      <ProvenanceBanner text="Demo simulation: illustrative results only. User-imported records are labeled as unverified." />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16
        }}
      >
        <div>
          <h1>History & Evaluation Reports</h1>
          <p style={{ marginTop: 4, fontSize: 14 }}>
            Repository of all route simulations, baseline evaluations, and imported audit files.
          </p>
        </div>

        <button
          type="button"
          className="cc-btn cc-btn-primary"
          onClick={handleExportCsv}
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Mobile Collapsible Import Section */}
      <div className="cc-mobile-import-toggle" style={{ display: "none", marginBottom: 16 }}>
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          onClick={() => setIsMobileImportOpen(!isMobileImportOpen)}
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UploadCloud size={16} color="var(--brand-blue)" />
            <span>Import Report CSV (Crate Widget)</span>
          </span>
          {isMobileImportOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Main 2-Column Grid: Left (70%) Table + Right (30%) Import Chest */}
      <div className="cc-history-layout" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        {/* Left Column: Filter Bar & Table */}
        <div>
          {/* Filter Bar */}
          <div
            className="cc-card"
            style={{
              padding: "14px 16px",
              marginBottom: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center"
            }}
          >
            {/* Search Input */}
            <div style={{ flex: "1 1 200px", minWidth: 180, position: "relative" }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="search"
                className="cc-search-input"
                placeholder="Filter by ID, name, or route..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="cc-search-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "auto", minWidth: 140, height: 36, fontSize: 13, cursor: "pointer" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed Trips</option>
              <option value="Cancelled">Cancelled Trips</option>
              <option value="In Transit">In Transit</option>
              <option value="Draft">Draft</option>
              <option value="Analyzed">Analyzed</option>
              <option value="Recommended">Recommended</option>
              <option value="Accepted">Accepted by Receiver</option>
              <option value="No Feasible Route">No Feasible Route</option>
            </select>

            {/* Category Filter */}
            <select
              className="cc-search-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: "auto", minWidth: 160, height: 36, fontSize: 13, cursor: "pointer" }}
            >
              <option value="ALL">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {(searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
              <button
                type="button"
                className="cc-btn cc-btn-ghost cc-btn-sm"
                onClick={clearAllFilters}
                style={{ color: "var(--brand-blue)" }}
              >
                <X size={13} />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Table Card */}
          <div className="cc-table-card">
            {filteredShipments.length === 0 ? (
              <div style={{ padding: 24 }}>
                <EmptyState
                  title="No matching shipments."
                  description="Adjust your search query or filters to view relevant route evaluation records."
                  action={
                    <button
                      type="button"
                      className="cc-btn cc-btn-secondary"
                      onClick={clearAllFilters}
                    >
                      <span>Clear filters</span>
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="cc-table-container">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th>Shipment ID</th>
                        <th>Name</th>
                        <th>Route</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Provenance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((s) => (
                        <tr
                          key={s.id}
                          className="cc-table-row-clickable"
                          onClick={() => navigate(`/shipments/${s.id}`)}
                        >
                          <td>
                            <CopyId id={s.id} />
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {s.origin} → {s.destination}
                          </td>
                          <td>{s.category}</td>
                          <td>
                            <StatusBadge status={s.status} />
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            {s.departureDateTime?.slice(0, 10) || s.createdAt?.slice(0, 10)}
                          </td>
                          <td>
                            <span
                              className={`cc-badge ${
                                s.source === "imported"
                                  ? "cc-badge-provenance-imported"
                                  : s.isDemoRecord
                                  ? "cc-badge-provenance-demo"
                                  : "cc-badge-provenance-simulated"
                              }`}
                            >
                              {s.source === "imported"
                                ? "User-imported (unverified)"
                                : s.isDemoRecord
                                ? "Demo"
                                : "User-defined (unverified)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="cc-mobile-card-list">
                  {filteredShipments.map((s) => (
                    <div
                      key={s.id}
                      className="cc-mobile-shipment-card"
                      onClick={() => navigate(`/shipments/${s.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <CopyId id={s.id} />
                        <StatusBadge status={s.status} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                          {s.origin} → {s.destination} • {s.category}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
                        <span>{s.departureDateTime?.slice(0, 10) || s.createdAt?.slice(0, 10)}</span>
                        <span
                          className={`cc-badge ${
                            s.source === "imported"
                              ? "cc-badge-provenance-imported"
                              : s.isDemoRecord
                              ? "cc-badge-provenance-demo"
                              : "cc-badge-provenance-simulated"
                          }`}
                        >
                          {s.source === "imported"
                            ? "User-imported (unverified)"
                            : s.isDemoRecord
                            ? "Demo"
                            : "User-defined (unverified)"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Import Card with Import Chest (Appendix B) */}
        <div className={`cc-history-import-col ${isMobileImportOpen ? "is-open" : ""}`}>
          <div className="cc-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ fontSize: 16, marginBottom: 4, textAlign: "center" }}>Import Report CSV</h2>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", marginBottom: 12 }}>
              Accepts .csv reports exported from this system (max 1 MB, 500 rows).
            </p>

            {/* 3D Import Chest */}
            <ImportChest onFileLoaded={handleFileLoaded} />

            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Columns required: id, name, category, route, status, date
            </div>

            {/* Import Feedback / Skipped Rows Summary */}
            {importFeedback && (
              <div
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  background: importFeedback.error ? "var(--danger-pale)" : "var(--surface-subtle)",
                  border: "1px solid var(--border)",
                  fontSize: 12
                }}
              >
                {importFeedback.error ? (
                  <div style={{ color: "var(--danger)", fontWeight: 600 }}>
                    {importFeedback.error}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      Import Summary: {importFeedback.count} added
                    </div>
                    {importFeedback.skippedRows && importFeedback.skippedRows.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                          Skipped Rows ({importFeedback.skippedRows.length}):
                        </div>
                        <ul style={{ paddingLeft: 16, color: "var(--text-muted)", maxHeight: 120, overflowY: "auto" }}>
                          {importFeedback.skippedRows.map((s, idx) => (
                            <li key={idx} style={{ marginBottom: 2 }}>
                              Row {s.row} ({s.id}): {s.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Remove imported records link */}
            {hasImportedRecords && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)", width: "100%", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowClearImportedModal(true)}
                  style={{ fontSize: 12, color: "var(--danger)", textDecoration: "underline" }}
                >
                  Remove imported records
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Imported Records */}
      <Modal
        isOpen={showClearImportedModal}
        onClose={() => setShowClearImportedModal(false)}
        title="Remove Imported Records?"
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <AlertCircle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            This action will remove all user-imported CSV records from your workspace. Built-in seed records and drafts will remain intact.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setShowClearImportedModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            style={{ background: "var(--danger)" }}
            onClick={handleClearImported}
          >
            Remove Records
          </button>
        </div>
      </Modal>
    </div>
  );
}
