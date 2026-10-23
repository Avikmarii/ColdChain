import { ROUTE_GEOMETRY } from "./routeGeometry";

export const PRODUCT_CATEGORIES = [
  "Vaccine",
  "Medical Supplies",
  "Temperature-Sensitive Food",
  "Pharmaceutical Product",
  "Other"
];

export const INSULATION_OPTIONS = [
  "Basic",
  "Moderate",
  "High"
];

export const COOLING_OPTIONS = [
  "Active (Refrigerated)",
  "Passive"
];

export function getRoutesForPair(origin, destination) {
  const key = `${origin}-${destination}`;
  const pair = ROUTE_GEOMETRY[key];
  if (!pair) return [];
  return [pair.routes["route-a"], pair.routes["route-b"]];
}
