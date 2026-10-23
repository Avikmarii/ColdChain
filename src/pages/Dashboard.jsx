import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Play,
  Layers,
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import CopyId from "../components/common/CopyId";
import EmptyState from "../components/common/EmptyState";
import ProvenanceBanner from "../components/common/ProvenanceBanner";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useShipments();
  const greeting = useMemo(() => getTimeGreeting(), []);

  // Compute live stats from shipment state
  const stats = useMemo(() => {
    let simulationsRun = 0;
    let routesEvaluated = 0;
    let excursionsFlagged = 0;
    let drafts = 0;

    state.shipments.forEach((s) => {
      if (s.status === "Draft") {
        drafts += 1;
      }
      if (s.analysis) {
        simulationsRun += 1;
        const routeKeys = Object.keys(s.analysis).filter(k => k.startsWith("route-"));
        routesEvaluated += routeKeys.length;

        routeKeys.forEach(k => {
          const res = s.analysis[k];
          if (res?.excursions && res.excursions.length > 0) {
            excursionsFlagged += res.excursions.length;
          }
        });
      }
    });

    return {
      simulationsRun,
      routesEvaluated,
      excursionsFlagged,
      drafts
    };
  }, [state.shipments]);

  // Needs attention items (e.g. drafts or shipments with excursions)
  const attentionItems = useMemo(() => {
    const list = [];
    state.shipments.forEach(s => {
      if (s.status === "Draft") {
        list.push({
          id: s.id,
          title: `${s.id} awaiting route evaluation`,
          sub: `${s.name} (${s.origin} → ${s.destination}) is ready for simulation`,
          type: "draft"
        });
      } else if (s.status === "No Feasible Route") {
        list.push({
          id: s.id,
          title: `${s.id} flagged: No feasible route under assumptions`,
          sub: `${s.name} exceeds configured thermal tolerances on candidate routes`,
          type: "warning"
        });
      }
    });
    return list.slice(0, 3);
  }, [state.shipments]);

  // Recent shipments
  const recentShipments = state.shipments.slice(0, 5);

  if (state.shipments.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto 0" }}>
        <EmptyState
          title="No shipments yet."
          description="Create your first shipment to begin evaluating transportation routes."
          action={
            <Link to="/shipments/new" className="cc-btn cc-btn-primary">
              <Plus size={16} />
              <span>Create Shipment</span>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <ProvenanceBanner text="Demo simulation: illustrative results only. Not connected to live IoT sensors or GPS feeds." />

      {/* Header section with time-aware greeting */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1>{greeting}, Manager</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-blue-deep)",
                background: "var(--soft-blue)",
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(57, 120, 246, 0.2)"
              }}
            >
              Demo Environment
            </span>
          </div>
          <p style={{ marginTop: 4, fontSize: 15 }}>
            Plan safer, smarter cold-chain journeys.
          </p>
        </div>

        <Link to="/shipments/new" className="cc-btn cc-btn-primary cc-btn-lg">
          <Plus size={18} />
          <span>+ New Shipment Analysis</span>
        </Link>
      </div>

      {/* 4 Stat Cards computed from state */}
      <div className="cc-stat-grid">
        <StatCard
          label="Simulations Run"
          value={stats.simulationsRun}
          subtext="Evaluated shipments"
          icon={Play}
        />
        <StatCard
          label="Routes Evaluated"
          value={stats.routesEvaluated}
          subtext="Highway corridors analyzed"
          icon={Layers}
        />
        <StatCard
          label="Excursions Flagged (demo)"
          value={stats.excursionsFlagged}
          subtext="Outside permitted limit"
          icon={AlertCircle}
        />
        <StatCard
          label="Drafts Pending"
          value={stats.drafts}
          subtext="Awaiting simulation"
          icon={FileText}
        />
      </div>

      {/* Main Grid: Recent Analyses (70%) + Attention (30%) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20
        }}
      >
        {/* Left Column: Recent Analyses Table */}
        <div style={{ flex: 2, minWidth: 0 }}>
          <div className="cc-table-card">
            <div className="cc-table-header-wrap">
              <h2 className="cc-table-title">Recent Analyses</h2>
              <Link
                to="/history"
                className="cc-btn cc-btn-ghost cc-btn-sm"
                style={{ fontSize: 13 }}
              >
                <span>View all</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Desktop / Tablet Table */}
            <div className="cc-table-container">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Shipment ID</th>
                    <th>Name</th>
                    <th>Origin → Destination</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr
                      key={s.id}
                      className="cc-table-row-clickable"
                      onClick={() => {
                        if (s.status === "Draft") {
                          navigate(`/shipments/${s.id}/analysis`);
                        } else if (s.status === "Recommended" || s.status === "No Feasible Route") {
                          navigate(`/shipments/${s.id}/results`);
                        } else {
                          navigate(`/shipments/${s.id}`);
                        }
                      }}
                    >
                      <td>
                        <CopyId id={s.id} />
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {s.origin} → {s.destination}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>
                        {s.status === "Draft" ? (
                          <Link
                            to={`/shipments/${s.id}/analysis`}
                            className="cc-btn cc-btn-secondary cc-btn-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Play size={13} />
                            <span>Run Analysis</span>
                          </Link>
                        ) : (
                          <Link
                            to={`/shipments/${s.id}/results`}
                            className="cc-btn cc-btn-secondary cc-btn-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>View Results</span>
                            <ChevronRight size={13} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="cc-mobile-card-list">
              {recentShipments.map((s) => (
                <div key={s.id} className="cc-mobile-shipment-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <CopyId id={s.id} />
                    <StatusBadge status={s.status} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginTop: 2
                      }}
                    >
                      {s.origin} → {s.destination}
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {s.status === "Draft" ? (
                      <Link
                        to={`/shipments/${s.id}/analysis`}
                        className="cc-btn cc-btn-secondary cc-btn-sm"
                        style={{ width: "100%" }}
                      >
                        <Play size={13} />
                        <span>Run Analysis</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/shipments/${s.id}/results`}
                        className="cc-btn cc-btn-secondary cc-btn-sm"
                        style={{ width: "100%" }}
                      >
                        <span>View Results</span>
                        <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Attention List (Illustrative) */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="cc-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14
              }}
            >
              <h2 style={{ fontSize: 16 }}>Items for Attention</h2>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  background: "#F1F5F9",
                  padding: "2px 6px",
                  borderRadius: 4
                }}
              >
                Illustrative
              </span>
            </div>

            <p style={{ fontSize: 13, marginBottom: 14 }}>
              Proactive flags requiring manager review or simulation execution.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {attentionItems.length > 0 ? (
                attentionItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: item.type === "warning" ? "var(--warning-pale)" : "var(--surface-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        fontSize: 13,
                        color: item.type === "warning" ? "#9A3412" : "var(--brand-blue-deep)"
                      }}
                    >
                      {item.type === "warning" ? (
                        <AlertCircle size={15} />
                      ) : (
                        <Clock size={15} />
                      )}
                      <span>{item.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {item.sub}
                    </div>
                    <Link
                      to={
                        item.type === "warning"
                          ? `/shipments/${item.id}/results`
                          : `/shipments/${item.id}/analysis`
                      }
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        marginTop: 4,
                        color: "var(--brand-blue)"
                      }}
                    >
                      <span>Take action</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 13
                  }}
                >
                  All shipments have completed route analyses.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
