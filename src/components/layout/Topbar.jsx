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
  Info
} from "lucide-react";
import { useShipments } from "../../context/ShipmentContext";

export default function Topbar({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, showToast } = useShipments();

  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Keyboard shortcut: '/' focuses the search box
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid triggering when user is typing in an input/textarea
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
    navigate(`/shipments/${id}`);
  };

  // Determine breadcrumb
  const getBreadcrumbs = () => {
    const p = location.pathname;
    if (p === "/") return [{ label: "Dashboard", path: "/" }];
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

      <div className="cc-topbar-center">
        <div className="cc-search-box">
          <Search size={16} className="cc-search-icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            className="cc-search-input"
            placeholder="Search shipments by ID, name, or route..."
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
              style={{ left: 0, right: 0, top: "calc(100% + 6px)" }}
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
                          fontSize: 12,
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
      </div>

      <div className="cc-topbar-right">
        <div className="cc-demo-badge" title="Demo simulation environment">
          <span className="cc-demo-dot" />
          <span>Demo Environment</span>
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
                    CC-001 Awaiting Route Analysis
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2
                    }}
                  >
                    Draft shipment ready for route comparison.
                  </div>
                </div>
                <div style={{ padding: "10px 16px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)"
                    }}
                  >
                    Ambient Simulation Updated
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 2
                    }}
                  >
                    Bengaluru–Mysuru corridor ambient model loaded at 32°C.
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
                  Cold-Chain Workbench Guide
                </div>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  Compare candidate routes, evaluate simulated temperature
                  fluctuations, and test scenarios.
                </p>
              </div>
              <div style={{ padding: "6px 0" }}>
                <button
                  type="button"
                  className="cc-popover-item"
                  onClick={() => {
                    navigate("/shipments/new");
                    setShowHelp(false);
                  }}
                >
                  <ChevronRight size={14} /> Create a new shipment
                </button>
                <button
                  type="button"
                  className="cc-popover-item"
                  onClick={() => {
                    navigate("/history");
                    setShowHelp(false);
                  }}
                >
                  <ChevronRight size={14} /> Import or export reports
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="cc-user-btn"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
              setShowHelp(false);
            }}
            aria-label="User Profile"
            title="Profile (Demo)"
          >
            <div className="cc-user-avatar">LM</div>
            <span className="cc-user-role">Manager</span>
          </button>
          {showProfile && (
            <div
              className="cc-popover"
              style={{ width: 200, right: 0 }}
              role="menu"
            >
              <button
                type="button"
                className="cc-popover-item"
                onClick={() => {
                  showToast(
                    "Profile settings",
                    "Demo mode: active user is Logistics Manager"
                  );
                  setShowProfile(false);
                }}
              >
                <User size={15} />
                <span>Profile</span>
              </button>
              <button
                type="button"
                className="cc-popover-item"
                onClick={() => {
                  navigate("/settings");
                  setShowProfile(false);
                }}
              >
                <Sliders size={15} />
                <span>Preferences</span>
              </button>
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "4px 0"
                }}
              />
              <button
                type="button"
                className="cc-popover-item"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  showToast(
                    "Demo Environment",
                    "Sign out is disabled in demo mode"
                  );
                  setShowProfile(false);
                }}
              >
                <LogOut size={15} />
                <span>Sign Out (Demo)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
