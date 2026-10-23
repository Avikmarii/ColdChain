import React from "react";
import { Clock, CheckCircle2, AlertTriangle, FileText, XCircle, Truck, ShieldCheck } from "lucide-react";

export default function StatusBadge({ status }) {
  let badgeClass = "cc-badge-draft";
  let Icon = FileText;
  let label = status || "Draft";

  switch (status) {
    case "Draft":
      badgeClass = "cc-badge-draft";
      Icon = Clock;
      break;
    case "Analyzed":
      badgeClass = "cc-badge-analyzed";
      Icon = FileText;
      break;
    case "Recommended":
      badgeClass = "cc-badge-recommended";
      Icon = CheckCircle2;
      break;
    case "Completed":
      badgeClass = "cc-badge-recommended";
      Icon = CheckCircle2;
      break;
    case "Accepted":
      badgeClass = "cc-badge-recommended";
      Icon = ShieldCheck;
      break;
    case "Cancelled":
      badgeClass = "cc-badge-no-feasible";
      Icon = XCircle;
      break;
    case "Quarantined":
      badgeClass = "cc-badge-draft";
      Icon = AlertTriangle;
      break;
    case "Rejected":
      badgeClass = "cc-badge-no-feasible";
      Icon = XCircle;
      break;
    case "In Transit":
    case "IN_TRANSIT":
      badgeClass = "cc-badge-analyzed";
      Icon = Truck;
      label = "In Transit";
      break;
    case "Arrived":
    case "ARRIVED":
      badgeClass = "cc-badge-recommended";
      Icon = CheckCircle2;
      label = "Arrived";
      break;
    case "No Feasible Route":
      badgeClass = "cc-badge-no-feasible";
      Icon = AlertTriangle;
      break;
    default:
      badgeClass = "cc-badge-draft";
      Icon = Clock;
  }

  return (
    <span className={`cc-badge ${badgeClass}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

