"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Package, Truck, MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Button, ShipmentStepper } from "@/components/ui";
import { formatDate, STATUS_LABELS, STATUS_COLORS, STATUS_SOLID, normalizeTrackingNumber, shipmentOrigin, shipmentDest } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_ICONS: Record<string, any> = {
  created: Package,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  exception: AlertCircle,
};

export default function TrackResultPage({
  params,
}: {
  params: { trackingNo: string };
}) {
  const { trackingNo } = params;
  const normalizedTrackingNo = normalizeTrackingNumber(trackingNo);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message?: string; hint?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/track?trackingNumber=${encodeURIComponent(normalizedTrackingNo)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError({
            title: data.error || "Error",
            message: data.message || "Failed to fetch shipment",
            hint: data.hint,
          });
          throw new Error("handled");
        }
        return data;
      })
      .then((data) => setShipment(data))
      .catch((err) => {
        if (err.message !== "handled") {
          setError({ title: "Network error", message: err.message });
        }
      })
      .finally(() => setLoading(false));
  }, [trackingNo]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="animate-pulse text-center text-gray-400">Loading shipment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{error.title}</h2>
          {error.message && <p className="mb-2 text-gray-600">{error.message}</p>}
          {error.hint && (
            <p className="mx-auto mb-6 max-w-md rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              {error.hint}
            </p>
          )}
          <Link href="/track">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const history = shipment?.statusHistory || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/track" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to tracking
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Tracking Number</p>
            <h1 className="text-2xl font-bold text-gray-900">{shipment.trackingNumber}</h1>
          </div>
          <Badge status={shipment.status} className="text-sm" />
        </div>
        <div className="mt-6 border-t border-gray-100 pt-6">
          <ShipmentStepper status={shipment.status} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-gray-400">From</p>
            <p className="font-medium text-gray-900">{shipmentOrigin(shipment)}</p>
          </div>
          <div>
            <p className="text-gray-400">To</p>
            <p className="font-medium text-gray-900">{shipmentDest(shipment)}</p>
          </div>
          <div>
            <p className="text-gray-400">Recipient</p>
            <p className="font-medium text-gray-900">{shipment.recipientName}</p>
          </div>
          <div>
            <p className="text-gray-400">Est. Delivery</p>
            <p className="font-medium text-gray-900">{formatDate(shipment.estimatedDelivery)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Shipment Timeline</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No status updates yet.</p>
        ) : (
          <div className="space-y-0">
            {history.map((entry: any, idx: number) => {
              const Icon = STATUS_ICONS[entry.status] || Circle;
              const isLast = idx === history.length - 1;
              return (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLast ? (STATUS_SOLID[entry.status] || "bg-brand-600 text-white") : (STATUS_COLORS[entry.status] || "bg-gray-100 text-gray-500")}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast && <div className="h-full w-0.5 flex-1 bg-gray-200" style={{ minHeight: "2rem" }} />}
                  </div>
                  <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{STATUS_LABELS[entry.status] || entry.status}</span>
                      <Badge status={entry.status} />
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {entry.location || <span className="italic text-gray-400">Location not recorded</span>}
                    </p>
                    {entry.description && <p className="mt-1 text-sm text-gray-600">{entry.description}</p>}
                    <p className="mt-1 text-xs text-gray-400">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
