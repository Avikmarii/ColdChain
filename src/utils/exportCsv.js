/**
 * CSV Export Utility
 * Generates RFC 4180-compliant CSV and sanitizes formula injection attacks.
 */

function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // Guard against spreadsheet formula injection (=, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Quote field if it contains commas, double quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function exportShipmentsToCsv(shipments) {
  const headers = ["id", "name", "category", "route", "status", "date", "provenance"];

  const rows = shipments.map((s) => {
    const routeStr = `${s.origin} to ${s.destination}`;
    const dateStr = s.departureDateTime || s.createdAt || new Date().toISOString();
    let provenanceStr = "demo-simulated";
    if (s.source === "imported") provenanceStr = "User-imported (unverified)";
    else if (s.source === "user") provenanceStr = "user-configured";

    return [
      sanitizeCsvCell(s.id),
      sanitizeCsvCell(s.name),
      sanitizeCsvCell(s.category),
      sanitizeCsvCell(routeStr),
      sanitizeCsvCell(s.status),
      sanitizeCsvCell(dateStr),
      sanitizeCsvCell(provenanceStr)
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");

  // Trigger download via Blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `coldchain-shipments-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
