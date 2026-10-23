import React, { useRef, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Route,
  Sliders,
  History,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export const BRAND_NAME = "ColdChain Intelligence";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/shipments/new", label: "New Shipment", icon: PlusCircle },
  { path: "/analysis", label: "Analysis", icon: Route },
  { path: "/scenarios", label: "Scenarios", icon: Sliders },
  { path: "/history", label: "History", icon: History }
];

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const location = useLocation();
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, opacity: 0 });

  // Update sliding indicator position
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(".is-active");
    if (activeEl) {
      const topOffset = activeEl.offsetTop;
      setIndicatorStyle({
        top: topOffset,
        opacity: 1
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [location.pathname]);

  const handleNavClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <aside
      className={`cc-sidebar ${isCollapsed ? "is-collapsed" : ""} ${
        isMobileOpen ? "is-mobile-open" : ""
      }`}
      aria-label="Sidebar navigation"
    >
      <div className="cc-sidebar-header">
        <NavLink to="/" className="cc-brand-link" onClick={handleNavClick}>
          <div className="cc-brand-logo" aria-hidden="true">
            {/* Abstract snowflake / crystal brand mark (does not animate) */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="14" y1="2" x2="14" y2="26" />
              <line x1="2" y1="14" x2="26" y2="14" />
              <line x1="5.5" y1="5.5" x2="22.5" y2="22.5" />
              <line x1="5.5" y1="22.5" x2="22.5" y2="5.5" />
              {/* Crystal facets */}
              <circle cx="14" cy="14" r="3.2" fill="var(--soft-blue)" strokeWidth="1.8" />
              <path d="M14 6l2 2m-4 0l2-2M14 22l2-2m-4 0l2 2" />
              <path d="M6 14l2 2m0-4l-2 2M22 14l-2 2m0-4l2 2" />
            </svg>
          </div>
          {!isCollapsed && <span className="cc-brand-name">{BRAND_NAME}</span>}
        </NavLink>

        <button
          type="button"
          className="cc-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="cc-nav-container" ref={navRef}>
        {/* Sliding nav indicator pill */}
        <div
          className="cc-nav-indicator"
          style={{
            transform: `translateY(${indicatorStyle.top}px)`,
            opacity: indicatorStyle.opacity
          }}
          aria-hidden="true"
        />

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`cc-nav-item ${isActive ? "is-active" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="cc-nav-icon">
                <Icon size={18} />
              </div>
              {!isCollapsed && <span className="cc-nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="cc-sidebar-footer">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `cc-nav-item ${isActive ? "is-active" : ""}`
          }
          title={isCollapsed ? "Settings" : undefined}
        >
          <div className="cc-nav-icon">
            <Settings size={18} />
          </div>
          {!isCollapsed && <span className="cc-nav-label">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
