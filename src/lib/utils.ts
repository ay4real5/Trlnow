import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTrackingNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TRL-${segment(4)}-${segment(4)}-${segment(4)}`;
}

export function normalizeTrackingNumber(input: string): string {
  // Remove all whitespace and uppercase the input
  let cleaned = input.trim().toUpperCase().replace(/\s/g, "");

  // If already in dashed format, keep it as-is (must match TRL-XXXX-XXXX-XXXX)
  if (/^TRL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleaned)) {
    return cleaned;
  }

  // If no dashes and starts with TRL followed by 12 characters, insert dashes
  const match = cleaned.match(/^TRL([A-Z0-9]{12})$/);
  if (match) {
    const body = match[1];
    return `TRL-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
  }

  // Otherwise return the cleaned version as best-effort
  return cleaned;
}

// Display-only cosmetic fix for admins typing "hamburg" instead of "Hamburg" —
// capitalizes the first letter of each word, leaving already-uppercase
// letters (acronyms like "USA", "UK") untouched. Never applied to stored data.
function capitalizeWords(s: string): string {
  return s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// Shipments can now route between any two places in the world (free-text
// city/country), not just a registered Branch. This is the single place that
// decides what to show for "origin"/"destination" — prefer the free-text
// location, fall back to a linked branch's name for older records.
export function locationLabel(
  city?: string | null,
  country?: string | null,
  branchName?: string | null
): string {
  if (city) return capitalizeWords(country ? `${city}, ${country}` : city);
  if (branchName) return branchName;
  return "—";
}

export function shipmentOrigin(s: { originCity?: string | null; originCountry?: string | null; originBranch?: { name: string } | null }): string {
  return locationLabel(s.originCity, s.originCountry, s.originBranch?.name);
}

export function shipmentDest(s: { destCity?: string | null; destCountry?: string | null; destBranch?: { name: string } | null }): string {
  return locationLabel(s.destCity, s.destCountry, s.destBranch?.name);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const SHIPMENT_STATUSES = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  exception: "Exception",
};

export const STATUS_COLORS: Record<string, string> = {
  created: "bg-gray-100 text-gray-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  exception: "bg-red-100 text-red-700",
};
