// Journey planning: generate a realistic sequence of tracking stops between
// two branches. Pure functions, safe to use client-side.

export interface JourneyStep {
  status: string;
  location: string;
  description: string;
  timestamp: string; // ISO
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

export function generateJourneyPlan(
  origin: BranchLike,
  dest: BranchLike,
  opts?: { start?: Date; end?: Date }
): JourneyStep[] {
  const originCity = cityFromBranchName(origin.name);
  const destCity = cityFromBranchName(dest.name);
  const originCountry = countryFromAddress(origin.address);
  const destCountry = countryFromAddress(dest.address);
  const international =
    !!originCountry && !!destCountry &&
    originCountry.toLowerCase() !== destCountry.toLowerCase();

  const at = (city: string, country: string) =>
    country ? `${city}, ${country}` : city;

  const steps: Omit<JourneyStep, "timestamp">[] = [
    {
      status: "created",
      location: origin.name,
      description: international
        ? "Shipment booked - export documentation prepared"
        : "Shipment booked",
    },
    {
      status: "picked_up",
      location: origin.name,
      description: "Collected from sender",
    },
  ];

  if (international) {
    steps.push(
      {
        status: "in_transit",
        location: `${originCity} International Sorting Facility, ${originCountry}`,
        description: "Processed and dispatched for international linehaul",
      },
      {
        status: "in_transit",
        location: at(`${originCity} Air Cargo Terminal`, originCountry),
        description: `Departed ${originCountry}`,
      },
      {
        status: "in_transit",
        location: at("Port of entry", destCountry),
        description: `Arrived in ${destCountry} - customs clearance in progress`,
      },
      {
        status: "in_transit",
        location: at(dest.name, destCountry),
        description: "Cleared customs - arrived at destination depot",
      }
    );
  } else {
    steps.push(
      {
        status: "in_transit",
        location: at(`${originCity} Sorting Facility`, originCountry),
        description: `In transit to ${destCity}`,
      },
      {
        status: "in_transit",
        location: at(dest.name, destCountry),
        description: "Arrived at destination depot",
      }
    );
  }

  steps.push(
    {
      status: "out_for_delivery",
      location: at(destCity, destCountry),
      description: "Loaded on delivery vehicle - out for delivery",
    },
    {
      status: "delivered",
      location: at(destCity, destCountry),
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
