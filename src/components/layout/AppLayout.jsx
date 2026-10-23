import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Toast from "../common/Toast";

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="cc-shell">
      {/* Mobile drawer backdrop */}
      <div
        className={`cc-drawer-overlay ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className="cc-main-wrapper">
        <Topbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="cc-content-container">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toast />
    </div>
  );
}
