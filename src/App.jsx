import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShipmentProvider } from "./context/ShipmentContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CreateShipment from "./pages/CreateShipment";
import RouteAnalysis from "./pages/RouteAnalysis";
import Results from "./pages/Results";
import ScenarioSimulator from "./pages/ScenarioSimulator";
import ShipmentPicker from "./pages/ShipmentPicker";
import History from "./pages/History";
import Settings from "./pages/Settings";
import ShipmentDetailsPage from "./pages/ShipmentDetailsPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ShipmentProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="shipments/new" element={<CreateShipment />} />
            <Route path="shipments/:id/edit" element={<CreateShipment />} />
            <Route path="shipments/:id" element={<ShipmentDetailsPage />} />
            <Route path="shipments/:id/analysis" element={<RouteAnalysis />} />
            <Route path="shipments/:id/results" element={<Results />} />
            <Route path="shipments/:id/scenarios" element={<ScenarioSimulator />} />
            <Route path="analysis" element={<ShipmentPicker />} />
            <Route path="scenarios" element={<ShipmentPicker />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ShipmentProvider>
    </BrowserRouter>
  );
}
