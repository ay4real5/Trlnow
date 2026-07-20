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

// Badge colors — one distinct, clearly-visible hue per status.
export const STATUS_COLORS: Record<string, string> = {
  created: "bg-gray-200 text-gray-700",
  picked_up: "bg-blue-200 text-blue-800",
  in_transit: "bg-indigo-200 text-indigo-800",
  out_for_delivery: "bg-amber-200 text-amber-800",
  delivered: "bg-green-200 text-green-800",
  exception: "bg-red-200 text-red-800",
};

// Solid version of the same hues, for the timeline's "current step" marker —
// same color family as STATUS_COLORS so a status is instantly recognizable
// whether it's the current step (solid fill) or a past one (light tint).
export const STATUS_SOLID: Record<string, string> = {
  created: "bg-gray-500 text-white",
  picked_up: "bg-blue-600 text-white",
  in_transit: "bg-indigo-600 text-white",
  out_for_delivery: "bg-amber-600 text-white",
  delivered: "bg-green-600 text-white",
  exception: "bg-red-600 text-white",
};
