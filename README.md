# ColdChain Intelligence

> **Plan safer, smarter cold-chain journeys.**
> Cold-chain route analysis workbench for evaluating temperature-sensitive transport.

---

## 1. Overview & Provenance Disclosure

**ColdChain Intelligence** is an analysis workbench designed for Logistics Managers to compare candidate highway transportation routes, model simulated temperature deviations during transit, test "What-If" scenarios (traffic delays, ambient heat waves, refrigeration interruptions), and review explainable recommendations.

### Mandatory Provenance Disclosures (Section 0)
- **Demo simulation only:** All telemetry curves, temperature excursions, and transit times are simulated model estimates (`demo-0.1`).
- **No live tracking:** The application is not connected to physical IoT temperature loggers, cellular OBD trackers, or live GPS telemetry.
- **No safety claims:** The workbench never labels any route or shipment as "safe", "safest", or "approved". Instead, it uses calibrated scientific language: *"meets configured limits in this simulation"* and *"preferred under current assumptions"*.
- **Banner requirement:** Every analytical view prominently features the disclaimer: *"Demo simulation: illustrative results only."*
- **Imported provenance:** User-imported CSV records are marked `"User-imported (unverified)"` and never generate phantom simulated values.

---

## 2. Project Architecture & Folder Map

```
coldchain-workbench/
├── public/                 # Static assets & map tiles
├── src/
│   ├── components/
│   │   ├── layout/         # AppLayout, Sidebar (with sliding indicator), Topbar
│   │   ├── common/         # Button, StatusBadge, StatCard, Modal, Toast,
│   │   │                   # ProvenanceBanner, AttentiveFace, CopyId, RiskBadge
│   │   ├── shipments/      # ShipmentForm (4-section grouped form)
│   │   ├── analysis/       # RouteMap (Leaflet), RouteCard, TemperatureChart (Recharts),
│   │   │                   # AnalysisSummary, RecommendationPanel
│   │   ├── scenarios/      # ScenarioControls, ScenarioComparison
│   │   └── history/        # ImportChest (3D Crate widget - Appendix B)
│   ├── pages/
│   │   ├── Dashboard.jsx           # Overview, time-aware greeting, live count-up stats
│   │   ├── CreateShipment.jsx      # Creation & edit mode with local persistence
│   │   ├── RouteAnalysis.jsx       # Hero screen: Map + cards + thermal graph
│   │   ├── Results.jsx             # Side-by-side breakdown & explainable recommendation
│   │   ├── ScenarioSimulator.jsx   # Interactive What-If delay & ambient sliders
│   │   ├── ShipmentPicker.jsx      # Route picker for /analysis and /scenarios
│   │   ├── ShipmentDetailsPage.jsx # Full parameters, activity log, driver demo modal
│   │   ├── History.jsx             # Search/filters, CSV export & 3D Import Chest
│   │   ├── Settings.jsx            # Motion preferences & demo data reset
│   │   └── NotFound.jsx            # 404 with animated AttentiveFace
│   ├── engine/                     # Decoupled simulation boundary (Section 7)
│   │   ├── thermalModel.js         # Deterministic lumped heat-transfer formula
│   │   ├── excursionDetector.js    # Breach tracking & duration calculation
│   │   ├── routeScorer.js          # Constraint evaluation & ranking
│   │   ├── scenarioEngine.js       # Baseline vs modified comparison engine
│   │   ├── index.js                # Public engine API
│   │   └── full.test.js            # Automated verification test suite
│   ├── data/
│   │   ├── demoShipments.js        # Seed shipments (CC-001 through CC-004)
│   │   ├── demoRoutes.js           # Route helpers & product categories
│   │   ├── routeGeometry.js        # Precomputed simplified polylines
│   │   └── demoScenarios.js        # Default scenario values
│   ├── context/
│   │   └── ShipmentContext.jsx     # Central useReducer & versioned localStorage (coldchain:v1)
│   ├── utils/
│   │   ├── exportCsv.js            # RFC 4180 export with formula injection sanitization
│   │   └── importCsv.js            # Custom CSV tokenizer with strict column validation
│   └── styles/
│       ├── variables.css           # Design tokens (colors, radii, typography)
│       ├── global.css              # Reset, focus rings, reduced-motion overrides
│       ├── layout.css              # Shell grid, sliding nav indicator, responsive rules
│       ├── components.css          # Cards, badges, micro-thermometer, toasts, tables
│       ├── face.css                # Appendix A: AttentiveFace SVG keyframes
│       └── chest.css               # Appendix B: 3D Import Chest crate perspective
├── App.jsx                         # React Router v6 setup
└── main.jsx                        # React root entry point
```

---

## 3. The Engine Boundary & Plugging in Real Services

In accordance with **Section 7**, UI components **never compute temperatures directly**. All simulation logic is encapsulated behind `src/engine/index.js`.

### The Engine Contract
```ts
analyzeRoute({ shipment, route, scenario }) => AnalysisResult
```

```json
{
  "routeId": "route-a",
  "scenario": { "extraDelayMin": 0, "ambientC": 32, "coolingInterruptionMin": 0 },
  "travelTimeMin": 180,
  "series": [{ "tMin": 0, "tempC": 4.0 }, "..."],
  "limits": { "minC": 2.0, "maxC": 8.0 },
  "excursions": [{ "startMin": 120, "endMin": 135, "peakC": 9.1 }],
  "maxC": 9.1,
  "minC": 3.8,
  "minutesOutOfRange": 15,
  "constraintStatus": "fails",
  "riskLevel": "medium",
  "provenance": "demo-simulated",
  "modelVersion": "demo-0.1"
}
```

### Where to Replace Demo Engines:
1. **Real Physical Simulation Engine:**
   - In `src/engine/thermalModel.js`, replace `calculateThermalSeries` with an API client that queries an external finite-element or thermodynamic modeling backend (e.g. CFD thermal package or Python simulation microservice).
2. **Real Commercial Routing Service:**
   - In `src/data/routeGeometry.js` and `src/engine/index.js`, replace precomputed geometry lookups with real API calls to Google Maps Platform Directions API or OpenRouteService.

---

## 4. Golden Path Walkthrough for Live Demos

To demonstrate the full workbench workflow:

1. **Dashboard (`/`):**
   - Observe the time-aware greeting (*"Good morning / afternoon / evening, Manager"*), the four live count-up stat cards, and the Attention item flagging `CC-001`.
2. **Hero Analysis (`/shipments/CC-001/analysis`):**
   - `CC-001` (*Vaccine Delivery 001*, Bengaluru to Mysuru, 2°C to 8°C limits) starts in `Draft` state.
   - Click **Run Demo Analysis**. Watch the skeleton shimmer and the subsequent graph draw-in (700ms).
   - **Route A (Faster):** 145 km, 3h 0m transit. Reaches a peak of **9.1°C**, suffering **1 excursion (15 minutes)**. Marked *Medium Risk* and *Does not meet limit*.
   - **Route B (Alternative):** 165 km, 3h 20m transit. Peaks at **6.2°C**, maintaining **0 excursions**. Marked *Low Risk* and *Meets configured limits*.
   - Click between Route A and Route B cards: watch the Leaflet polylines thicken and sync with the Recharts graph. Notice the soft diagonal-hatch excursion fill over the breach region.
3. **Recommendation & Results (`/shipments/CC-001/results`):**
   - Click **View Detailed Results**.
   - Review the recommendation panel: **Route B is preferred under current assumptions** because it exhibits no simulated excursions, despite being 20 minutes longer.
   - Click **Save to History** to record the analysis into the persistent history log.
4. **What-If Scenario Simulator (`/shipments/CC-001/scenarios`):**
   - Open Scenarios. Notice the baseline curve (blue) matches Route A from the analysis screen.
   - Adjust the delay to `30 minutes`, ambient to `35°C`, and toggle Cooling Interruption to ON.
   - Notice the modified curve (red) surges to **10.5°C** with a **25-minute excursion**, accompanied by a calibrated plain-English assessment.
5. **History & Reports (`/history`):**
   - Click **Export CSV** to download `coldchain-shipments-YYYY-MM-DD.csv`.
   - Hover or drag a CSV over the **3D Import Chest** in the right column. Notice the lid smoothly opens in 3D perspective.
   - Drop the exported CSV back into the chest: the validation engine accurately identifies all existing shipments as duplicates and lists them in the expandable *Skipped Rows* panel.
6. **No Feasible Route Case (`CC-004`):**
   - Open `CC-004` (Bengaluru to Pune, Basic insulation, Passive cooling, narrow 2°C - 4°C band).
   - Observe that the recommendation panel displays: *"No feasible route found under current assumptions"* and transparently advises packaging upgrades.

---

## 5. CSV Import & Export Specification

Exported CSV files and accepted import formats adhere to the following schema:

| Column | Type | Allowed Values / Format | Notes |
|---|---|---|---|
| `id` | String | `CC-###` or alphanumeric | Must be unique; duplicates are skipped. |
| `name` | String | Non-empty text | Label of the shipment. |
| `category` | String | `Vaccine`, `Medical Supplies`, `Temperature-Sensitive Food`, `Pharmaceutical Product`, `Other` | Unrecognized categories map to `Other`. |
| `route` | String | `"CityA to CityB"` or `"CityA → CityB"` | Origin and destination corridor. |
| `status` | String | `Draft`, `Analyzed`, `Recommended`, `No Feasible Route` | Unrecognized statuses map to `Draft`. |
| `date` | String | ISO 8601 string or `YYYY-MM-DD` | Departure or creation date. |
| `provenance` | String | Text | Sanitized; imported rows are tagged `User-imported (unverified)`. |

### Security Safeguards
- **Formula Injection Prevention:** Any cell beginning with `=`, `+`, `-`, or `@` is prefixed with a single quote (`'`).
- **Safety Limits:** Files are constrained to a maximum of 1 MB and 500 data rows.
- **XSS Immunity:** Cells are strictly parsed into text data models and never rendered as raw HTML.

---

## 6. Known Limitations

1. **Deterministic Thermal Model:** The thermal curve formula (`demo-0.1`) is a lumped mathematical model calibrated for demonstration predictability; it does not replace calibrated lab test chamber validation or finite element analysis.
2. **Simplified Polylines:** Highway coordinates are precomputed representative road corridors (not live turn-by-turn navigation vectors).
3. **Client-side Storage:** State is persisted in browser `localStorage`. Using multiple browser profiles or clearing browser site data will reset state to seed values.
