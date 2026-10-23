import { Request, Response, NextFunction } from "express";
import { ApiError } from "./errorHandler";
import { PRODUCT_CATEGORIES, INSULATION_OPTIONS, COOLING_OPTIONS } from "../data/demoRoutes";
import { DEMO_CITIES, getRoutePairGeometry } from "../data/routeGeometry";

const ALLOWED_SHIPMENT_FIELDS = new Set([
  "id",
  "name",
  "category",
  "description",
  "origin",
  "destination",
  "departureDateTime",
  "maxTransitHours",
  "temperatureLimits",
  "container",
  "status",
  "selectedRouteId",
  "assignedDriver",
  "analysis",
  "activity",
  "isDemoRecord",
  "source",
  "createdAt",
  "updatedAt"
]);

const ALLOWED_TEMP_FIELDS = new Set([
  "minC",
  "maxC",
  "unit",
  "source",
  "isDemoAssumption",
  "notes"
]);

const ALLOWED_CONTAINER_FIELDS = new Set([
  "insulation",
  "coolingSystem",
  "notes"
]);

export function validateShipmentInput(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  if (!body || typeof body !== "object") {
    return next(new ApiError(400, "INVALID_PAYLOAD", "Request body must be a valid JSON object."));
  }

  // Reject unknown top-level fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_SHIPMENT_FIELDS.has(key)) {
      return next(new ApiError(400, "UNKNOWN_FIELD", `Unknown field rejected: '${key}'`));
    }
  }

  // Name validation
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return next(new ApiError(400, "VALIDATION_FAILED", "Shipment 'name' is required."));
  }
  if (body.name.length > 120) {
    return next(new ApiError(400, "VALIDATION_FAILED", "Shipment 'name' exceeds max length of 120 characters."));
  }

  // Description length
  if (body.description && typeof body.description === "string" && body.description.length > 500) {
    return next(new ApiError(400, "VALIDATION_FAILED", "Description exceeds max length of 500 characters."));
  }

  // Origin & Destination
  if (!body.origin || !DEMO_CITIES.includes(body.origin)) {
    return next(new ApiError(400, "VALIDATION_FAILED", `Origin must be one of: ${DEMO_CITIES.join(", ")}`));
  }
  if (!body.destination || !DEMO_CITIES.includes(body.destination)) {
    return next(new ApiError(400, "VALIDATION_FAILED", `Destination must be one of: ${DEMO_CITIES.join(", ")}`));
  }
  if (!getRoutePairGeometry(body.origin, body.destination)) {
    return next(new ApiError(400, "UNSUPPORTED_CORRIDOR", `No highway corridor data available for ${body.origin} to ${body.destination}.`));
  }

  // Category
  if (body.category && !PRODUCT_CATEGORIES.includes(body.category)) {
    return next(new ApiError(400, "VALIDATION_FAILED", `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`));
  }

  // Max Transit Hours
  if (body.maxTransitHours !== undefined) {
    const hours = Number(body.maxTransitHours);
    if (isNaN(hours) || hours <= 0 || hours > 72) {
      return next(new ApiError(400, "VALIDATION_FAILED", "maxTransitHours must be between 0.5 and 72 hours."));
    }
  }

  // Temperature Limits
  if (body.temperatureLimits) {
    if (typeof body.temperatureLimits !== "object") {
      return next(new ApiError(400, "VALIDATION_FAILED", "temperatureLimits must be an object."));
    }
    for (const key of Object.keys(body.temperatureLimits)) {
      if (!ALLOWED_TEMP_FIELDS.has(key)) {
        return next(new ApiError(400, "UNKNOWN_FIELD", `Unknown field in temperatureLimits: '${key}'`));
      }
    }

    const { minC, maxC } = body.temperatureLimits;
    if (minC === undefined || maxC === undefined) {
      return next(new ApiError(400, "VALIDATION_FAILED", "temperatureLimits.minC and maxC are required."));
    }
    const numMin = Number(minC);
    const numMax = Number(maxC);

    if (isNaN(numMin) || isNaN(numMax)) {
      return next(new ApiError(400, "VALIDATION_FAILED", "Temperature values must be numeric."));
    }
    if (numMin < -80 || numMin > 60 || numMax < -80 || numMax > 60) {
      return next(new ApiError(400, "VALIDATION_FAILED", "Temperatures must be within the supported range of -80°C to 60°C."));
    }
    if (numMin >= numMax) {
      return next(new ApiError(400, "VALIDATION_FAILED", "Minimum temperature must be strictly below maximum temperature."));
    }
  }

  // Container configuration
  if (body.container) {
    if (typeof body.container !== "object") {
      return next(new ApiError(400, "VALIDATION_FAILED", "container must be an object."));
    }
    for (const key of Object.keys(body.container)) {
      if (!ALLOWED_CONTAINER_FIELDS.has(key)) {
        return next(new ApiError(400, "UNKNOWN_FIELD", `Unknown field in container: '${key}'`));
      }
    }
    if (body.container.insulation && !INSULATION_OPTIONS.includes(body.container.insulation)) {
      return next(new ApiError(400, "VALIDATION_FAILED", `container.insulation must be one of: ${INSULATION_OPTIONS.join(", ")}`));
    }
    if (body.container.coolingSystem && !COOLING_OPTIONS.includes(body.container.coolingSystem)) {
      return next(new ApiError(400, "VALIDATION_FAILED", `container.coolingSystem must be one of: ${COOLING_OPTIONS.join(", ")}`));
    }
  }

  next();
}
