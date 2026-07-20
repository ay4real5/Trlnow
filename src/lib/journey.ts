// Journey planning: generate a realistic sequence of tracking stops between
// any two places in the world — a shipment's origin/destination don't have
// to be one of our own branches. Pure functions, safe to use client-side.

export interface JourneyStep {
  status: string;
  location: string;
  description: string;
  timestamp: string; // ISO
}

export interface Location {
  label: string;   // what to show in the timeline for the origin/dest stop
  city: string;
  country: string; // "" if unknown — disables international-route detection
}

interface BranchLike {
  name: string;
  address?: string | null;
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "USA",
  us: "USA",
  "united states": "USA",
  "united states of america": "USA",
  uk: "UK",
  "united kingdom": "UK",
  "great britain": "UK",
  england: "UK",
};

function normalizeCountry(raw: string): string {
  const cleaned = raw.trim().replace(/[.]/g, "");
  return COUNTRY_ALIASES[cleaned.toLowerCase()] || cleaned;
}

// "Hamburg Hub" -> "Hamburg"; "Milwaukee Depot" -> "Milwaukee"
export function cityFromBranchName(name: string): string {
  const stop = /^(hub|depot|centre|center|branch|office|terminal|facility|warehouse)$/i;
  const words = name.trim().split(/\s+/).filter((w) => !stop.test(w));
  return words.join(" ") || name.trim();
}

export function countryFromAddress(address?: string | null): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  return normalizeCountry(parts[parts.length - 1]);
}

// Build a routing Location from whichever data the shipment actually has:
// free-text city/country (any place in the world) takes priority; a linked
// branch is used as a fallback so older, branch-only shipments still work.
export function resolveLocation(
  city?: string | null,
  country?: string | null,
  branch?: BranchLike | null
): Location {
  if (city && city.trim()) {
    const c = normalizeCountry((country || "").trim());
    return {
      label: c ? `${city.trim()}, ${c}` : city.trim(),
      city: city.trim(),
      country: c,
    };
  }
  if (branch) {
    return {
      label: branch.name,
      city: cityFromBranchName(branch.name),
      country: countryFromAddress(branch.address),
    };
  }
  return { label: "Unknown location", city: "Unknown", country: "" };
}

export function generateJourneyPlan(
  origin: Location,
  dest: Location,
  opts?: { start?: Date; end?: Date }
): JourneyStep[] {
  const international =
    !!origin.country && !!dest.country &&
    origin.country.toLowerCase() !== dest.country.toLowerCase();

  const at = (city: string, country: string) =>
    country ? `${city}, ${country}` : city;

  const steps: Omit<JourneyStep, "timestamp">[] = [
    {
      status: "created",
      location: origin.label,
      description: international
        ? "Shipment booked - export documentation prepared"
        : "Shipment booked",
    },
    {
      status: "picked_up",
      location: origin.label,
      description: "Collected from sender",
    },
  ];

  if (international) {
    steps.push(
      {
        status: "in_transit",
        location: `${origin.city} International Sorting Facility, ${origin.country}`,
        description: "Processed and dispatched for international linehaul",
      },
      {
        status: "in_transit",
        location: at(`${origin.city} Air Cargo Terminal`, origin.country),
        description: `Departed ${origin.country}`,
      },
      {
        status: "in_transit",
        location: at("Port of entry", dest.country),
        description: `Arrived in ${dest.country} - customs clearance in progress`,
      },
      {
        status: "in_transit",
        location: at(`${dest.city} Sorting Facility`, dest.country),
        description: "Cleared customs - arrived at destination facility",
      }
    );
  } else {
    steps.push(
      {
        status: "in_transit",
        location: at(`${origin.city} Sorting Facility`, origin.country),
        description: `In transit to ${dest.city}`,
      },
      {
        status: "in_transit",
        location: at(`${dest.city} Sorting Facility`, dest.country),
        description: "Arrived at destination facility",
      }
    );
  }

  steps.push(
    {
      status: "out_for_delivery",
      location: dest.label,
      description: "Loaded on delivery vehicle - out for delivery",
    },
    {
      status: "delivered",
      location: dest.label,
      description: "Delivered to recipient",
    }
  );

  // Spread timestamps evenly across the window
  const end = opts?.end ?? new Date();
  const start = opts?.start ?? new Date(end.getTime() - 2 * 24 * 60 * 60 * 1000);
  const span = Math.max(end.getTime() - start.getTime(), steps.length * 60_000);
  const gap = span / (steps.length - 1);

  return steps.map((s, i) => ({
    ...s,
    timestamp: new Date(start.getTime() + gap * i).toISOString(),
  }));
}
