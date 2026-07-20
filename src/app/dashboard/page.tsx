"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Package, Search } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Button, Input, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate, shipmentDest } from "@/lib/utils";
import ProtectedRoute from "@/components/ProtectedRoute";

function DashboardContent() {
  const { data: session } = useSession();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchShipments() {
      if (!session?.user?.id) return;
      const res = await fetch("/api/my-shipments");
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      }
      setLoading(false);
    }
    fetchShipments();
  }, [session]);

  const filtered = shipments.filter((s) =>
    s.trackingNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Shipments</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by tracking number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-center text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            message="You have no shipments yet."
            icon={<Package className="h-12 w-12" />}
          />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tracking Number</Th>
              <Th>Recipient</Th>
              <Th>Destination</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Est. Delivery</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/track/${s.trackingNumber}`} className="font-medium text-brand-600 hover:underline">
                    {s.trackingNumber}
                  </Link>
                </Td>
                <Td>{s.recipientName}</Td>
                <Td>{shipmentDest(s)}</Td>
                <Td><Badge status={s.status} /></Td>
                <Td>{formatDate(s.createdAt)}</Td>
                <Td>{formatDate(s.estimatedDelivery)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
