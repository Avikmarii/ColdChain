import { isRoutePairSupported } from '../data/demoRoutes';

export function validateShipmentForm(values, existingShipments = [], currentId = null) {
  const errors = {};

  // Manual Shipment ID Validation
  if (!values.id || !values.id.trim()) {
    errors.id = "Shipment ID is required.";
  } else if (!/^[A-Za-z0-9_-]+$/.test(values.id.trim())) {
    errors.id = "ID can only contain letters, numbers, hyphens, and underscores.";
  } else {
    const idExists = existingShipments.some(
      s => s.id.toLowerCase() === values.id.trim().toLowerCase() && s.id !== currentId
    );
    if (idExists) {
      errors.id = "Shipment ID already exists. Please enter a unique identifier.";
    }
  }

  // Shipment Name
  if (!values.name || !values.name.trim()) {
    errors.name = "Shipment name is required.";
  }

  // Journey & Route Compatibility
  if (!values.origin || !values.origin.trim()) {
    errors.origin = "Origin city is required.";
  }

  if (!values.destination || !values.destination.trim()) {
    errors.destination = "Destination city is required.";
  } else if (values.origin && values.origin.trim().toLowerCase() === values.destination.trim().toLowerCase()) {
    errors.destination = "Destination must differ from origin.";
  } else if (values.origin && !isRoutePairSupported(values.origin, values.destination)) {
    errors.destination = "No precomputed route geometry exists for this pair.";
  }

  // Departure & Transit Limits
  if (!values.departureDateTime) {
    errors.departureDateTime = "Departure date & time is required.";
  }

  if (!values.maxTransitHours || Number(values.maxTransitHours) <= 0) {
    errors.maxTransitHours = "Valid transit time limit (hours) is required.";
  }

  // Temperature Bounds
  const minC = parseFloat(values.minC);
  const maxC = parseFloat(values.maxC);

  if (isNaN(minC)) {
    errors.minC = "Minimum temperature is required.";
  }
  if (isNaN(maxC)) {
    errors.maxC = "Maximum temperature is required.";
  }
  if (!isNaN(minC) && !isNaN(maxC) && minC >= maxC) {
    errors.maxC = "Maximum temperature must be strictly greater than minimum.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
