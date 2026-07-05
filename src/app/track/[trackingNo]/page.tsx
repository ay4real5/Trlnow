"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Package, Truck, MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { formatDate, STATUS_LABELS } from "@/lib/utils";

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
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/track?trackingNumber=${encodeURIComponent(trackingNo)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch");
        }
        return res.json();
      })
      .then((data) => setShipment(data))
      .catch((err) => setError(err.message))
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
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Shipment Not Found</h2>
          <p className="mb-6 text-gray-600">{error}</p>
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
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-gray-400">From</p>
            <p className="font-medium text-gray-900">{shipment.originBranch?.name}</p>
          </div>
          <div>
            <p className="text-gray-400">To</p>
            <p className="font-medium text-gray-900">{shipment.destBranch?.name}</p>
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
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLast ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast && <div className="h-full w-0.5 flex-1 bg-gray-200" style={{ minHeight: "2rem" }} />}
                  </div>
                  <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{STATUS_LABELS[entry.status] || entry.status}</span>
                      <Badge status={entry.status} />
                    </div>
                    {entry.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {entry.location}
                      </p>
                    )}
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
