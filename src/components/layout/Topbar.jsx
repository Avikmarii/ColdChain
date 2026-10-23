import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronRight,
  User,
  Sliders,
  LogOut,
  LayoutDashboard,
  Truck,
  Building2,
  ShieldCheck
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";

export default function Topbar({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setPersona, showToast } = useShipments();

  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Synchronize persona based on route
  const currentPath = location.pathname;
  let activePersona = state.activePersona || "manager";

  if (currentPath.startsWith("/driver")) {
    activePersona = "driver";
  } else if (currentPath.startsWith("/receiving")) {
    activePersona = "receiving";
  } else if (
    currentPath === "/" ||
    currentPath.startsWith("/shipments") ||
    currentPath.startsWith("/analysis") ||
    currentPath.startsWith("/scenarios") ||
    currentPath.startsWith("/history") ||
    currentPath.startsWith("/settings")
  ) {
    activePersona = "manager";
  }

  // Keyboard shortcut: '/' focuses the search box
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter matching shipments for search dropdown
  const searchResults = searchQuery.trim()
    ? state.shipments.filter(
        (s) =>
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${s.origin} to ${s.destination}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectShipment = (id) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    if (activePersona === "driver") {
      navigate(`/driver/${encodeURIComponent(id)}`);
    } else if (activePersona === "receiving") {
      navigate(`/receiving/${encodeURIComponent(id)}`);
    } else {
      navigate(`/shipments/${encodeURIComponent(id)}`);
    }
  };

  // Extract current shipment ID from URL if present
  const shipmentIdMatch = location.pathname.match(/\/(shipments|driver|receiving)\/([^/]+)/);
  const currentShipmentId = shipmentIdMatch ? shipmentIdMatch[2] : null;

  const handleSwitchPersona = (newPersona) => {
    setPersona(newPersona);
    if (newPersona === "manager") {
      if (currentShipmentId) {
        navigate(`/shipments/${currentShipmentId}`);
      } else {
        navigate("/");
      }
    } else if (newPersona === "driver") {
      if (currentShipmentId) {
        navigate(`/driver/${currentShipmentId}`);
      } else {
        navigate("/driver");
      }
    } else if (newPersona === "receiving") {
      if (currentShipmentId) {
        navigate(`/receiving/${currentShipmentId}`);
      } else {
        navigate("/receiving");
      }
    }
  };

  // Determine breadcrumb
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === "/") return [{ label: "Manager Dashboard", path: "/" }];
    if (p === "/shipments/new")
      return [
        { label: "Dashboard", path: "/" },
        { label: "New Shipment", path: "/shipments/new" }
      ];
    if (p.includes("/analysis"))
      return [
        { label: "Dashboard", path: "/" },
        { label: "Route Comparison", path: p }
      ];
    if (p.includes("/results"))
      return [
        { label: "Dashboard", path: "/" },
        { label: "Recommendation", path: p }
      ];
    if (p.includes("/scenarios"))
      return [
        { label: "Dashboard", path: "/" },
        { label: "What-If Scenarios", path: p }
      ];
    if (p === "/history")
      return [
        { label: "Dashboard", path: "/" },
        { label: "History & Reports", path: "/history" }
      ];
    if (p === "/settings")
      return [
        { label: "Dashboard", path: "/" },
        { label: "Settings", path: "/settings" }
      ];
    if (p === "/driver")
      return [{ label: "Driver Cockpit", path: "/driver" }];
    if (p.startsWith("/driver/")) {
      const id = decodeURIComponent(p.replace("/driver/", ""));
      return [
        { label: "Driver Cockpit", path: "/driver" },
        { label: `In-Transit: ${id}`, path: p }
      ];
    }
    if (p === "/receiving")
      return [{ label: "Hospital Receiving", path: "/receiving" }];
    if (p.startsWith("/receiving/")) {
      const id = decodeURIComponent(p.replace("/receiving/", ""));
      return [
        { label: "Hospital Receiving", path: "/receiving" },
        { label: `Inspection: ${id}`, path: p }
      ];
    }
    if (p.startsWith("/shipments/"))
      return [
        { label: "Dashboard", path: "/" },
        { label: "Shipment Details", path: p }
      ];
    return [{ label: "ColdChain Intelligence", path: "/" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="cc-topbar">
      <div className="cc-topbar-left">
        <button
          type="button"
          className="cc-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <nav aria-label="Breadcrumb" className="cc-breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <ChevronRight size={14} className="text-muted" />}
              <span
                className={
                  idx === breadcrumbs.length - 1 ? "cc-breadcrumb-active" : ""
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Central Persona Switcher - Section 1 Requirement */}
      <div className="cc-topbar-center">
        <div className="cc-persona-switcher" role="tablist" aria-label="Select Cold-Chain Persona">
          <button
            type="button"
            role="tab"
            aria-selected={activePersona === "manager"}
            className={`cc-persona-btn ${activePersona === "manager" ? "is-active" : ""}`}
            onClick={() => handleSwitchPersona("manager")}
            title="Switch to Logistics Manager planning view"
          >
            <LayoutDashboard size={14} />
            <span>Logistics Manager</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePersona === "driver"}
            className={`cc-persona-btn ${activePersona === "driver" ? "is-active" : ""}`}
            onClick={() => handleSwitchPersona("driver")}
            title="Switch to Driver In-Transit mobile cockpit"
          >
            <Truck size={14} />
            <span>Driver In-Transit</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activePersona === "receiving"}
            className={`cc-persona-btn ${activePersona === "receiving" ? "is-active" : ""}`}
            onClick={() => handleSwitchPersona("receiving")}
            title="Switch to Hospital Receiving & Inspection portal"
          >
            <ShieldCheck size={14} />
            <span>Hospital Receiver</span>
          </button>
        </div>
      </div>

      <div className="cc-topbar-right">
        {/* Search Input Box */}
        <div className="cc-search-box">
          <Search size={15} className="cc-search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            className="cc-search-input"
            placeholder="Search manifests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            aria-label="Search shipments"
          />
          <kbd className="cc-search-shortcut" title="Press / to focus search">
            /
          </kbd>

          {/* Search Dropdown matches */}
          {isSearchFocused && searchQuery.trim() && (
            <div
              className="cc-popover"
              style={{ right: 0, top: "calc(100% + 6px)", width: 320, maxWidth: "min(340px, 90vw)" }}
            >
              {searchResults.length > 0 ? (
                <div>
                  <div
                    style={{
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase"
                    }}
                  >
                    Matching Shipments ({searchResults.length})
                  </div>
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="cc-popover-item"
                      onMouseDown={() => handleSelectShipment(item.id)}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 12,
                          color: "var(--brand-blue)"
                        }}
                      >
                        {item.id}
                      </span>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-secondary)",
                          marginLeft: "auto"
                        }}
                      >
                        {item.origin} → {item.destination}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-secondary)"
                  }}
                >
                  No matching shipments found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="cc-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHelp(false);
              setShowProfile(false);
            }}
            aria-label="Notifications"
            title="Notifications (Demo)"
          >
            <Bell size={18} />
          </button>
          {showNotifications && (
            <div
              className="cc-popover"
              style={{ width: 300, right: 0 }}
              role="dialog"
            >
              <div
                style={{
                  padding: "8px 16px 12px",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>Notifications</span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--brand-blue)",
                    background: "var(--soft-blue)",
                    padding: "2px 6px",
                    borderRadius: 4
                  }}
                >
                  Demo Items
                </span>
              </div>
              <div style={{ padding: "8px 0" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)"
                    }}
                  >
                    Multi-Persona Workflow Active
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2
                    }}
                  >
                    Seamlessly test Manager, Driver cockpit, and Hospital Receiving.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Popover */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="cc-icon-btn"
            onClick={() => {
              setShowHelp(!showHelp);
              setShowNotifications(false);
              setShowProfile(false);
            }}
            aria-label="Help and guidance"
            title="Help"
          >
            <HelpCircle size={18} />
          </button>
          {showHelp && (
            <div
              className="cc-popover"
              style={{ width: 280, right: 0 }}
              role="dialog"
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)"
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                  Multi-Persona Suite Guide
                </div>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Use the switcher in the topbar to test <strong>Logistics Manager</strong>, <strong>Driver Cockpit</strong>, or <strong>Hospital Receiving</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile indicator */}
        <div className="cc-user-btn" title={`Active Persona: ${activePersona}`}>
          <div className="cc-user-avatar">
            {activePersona === "driver" ? "DR" : activePersona === "receiving" ? "HR" : "LM"}
          </div>
          <span className="cc-user-role">
            {activePersona === "driver" ? "Driver" : activePersona === "receiving" ? "Receiver" : "Manager"}
          </span>
        </div>
      </div>
    </header>
  );
}
