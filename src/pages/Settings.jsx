import React, { useState } from "react";
import { Sliders, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { useShipments } from "../context/ShipmentContext";
import Modal from "../components/common/Modal";
import ProvenanceBanner from "../components/common/ProvenanceBanner";

export default function Settings() {
  const { state, dispatch, showToast } = useShipments();
  const [showResetModal, setShowResetModal] = useState(false);

  const handleToggleReduceMotion = (e) => {
    const isChecked = e.target.checked;
    dispatch({
      type: "SET_SETTINGS",
      payload: { reduceMotion: isChecked }
    });
    showToast(
      isChecked ? "Reduced motion enabled" : "Standard motion restored",
      "Motion settings updated for this workspace",
      "info"
    );
  };

  const handleResetData = () => {
    dispatch({ type: "RESET_DEMO_DATA" });
    setShowResetModal(false);
    showToast("Demo data reset", "All seed shipments and configurations restored", "success");
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <ProvenanceBanner text="Demo simulation: illustrative results only." />

      <div style={{ marginBottom: 24 }}>
        <h1>Workbench Settings</h1>
        <p style={{ marginTop: 4, fontSize: 14 }}>
          Manage workspace display preferences and simulated data state.
        </p>
      </div>

      <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Brand Label */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Brand Label
          </label>
          <input
            type="text"
            className="cc-search-input"
            value={state.settings.brandLabel}
            readOnly
            style={{ maxWidth: 360, background: "var(--surface-subtle)" }}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            System brand identifier (ColdChain Intelligence).
          </p>
        </div>

        {/* Temperature Unit */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Temperature Unit
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              style={{
                borderColor: "var(--brand-blue)",
                background: "var(--soft-blue)",
                color: "var(--brand-blue-deep)",
                fontWeight: 600
              }}
            >
              Celsius (°C)
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Currently fixed to Celsius (°C) per pharmaceutical and vaccine transportation standards.
          </p>
        </div>

        {/* Reduced Motion Toggle */}
        <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Reduce Motion</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                Disable animations, chest opening transitions, and count-up numbers.
              </p>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={state.settings.reduceMotion}
                onChange={handleToggleReduceMotion}
                style={{ opacity: 0, width: 0, height: 0 }}
                aria-label="Toggle reduced motion"
              />
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: state.settings.reduceMotion ? "var(--brand-blue)" : "#CBD5E1",
                  borderRadius: 24,
                  transition: "0.2s"
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: state.settings.reduceMotion ? 22 : 2,
                    top: 2,
                    width: 20,
                    height: 20,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    transition: "0.2s"
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* Reset Demo Data */}
        <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)" }}>
                Reset Demo Data
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                Restores original seed shipments (CC-001 through CC-004) and clears local modifications.
              </p>
            </div>
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => setShowResetModal(true)}
              style={{ color: "var(--danger)", borderColor: "#FECDD3" }}
            >
              <RotateCcw size={15} />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Demo Data?"
      >
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            This will reset all shipments to their initial seed state. Any user-created shipments and analyses will be removed.
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() => setShowResetModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            style={{ background: "var(--danger)" }}
            onClick={handleResetData}
          >
            Yes, Reset Data
          </button>
        </div>
      </Modal>
    </div>
  );
}
