"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Package } from "lucide-react";
import { Card, Badge, Button, Input, Select, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate, SHIPMENT_STATUSES, STATUS_LABELS, normalizeTrackingNumber } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", branchId: "", search: "" });

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => setBranches(data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.branchId) params.set("branchId", filters.branchId);
    setLoading(true);
    fetch(`/api/shipments?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setShipments(data))
      .finally(() => setLoading(false));
  }, [filters.status, filters.branchId]);

  const normalizedSearch = normalizeTrackingNumber(filters.search);
  const filtered = shipments.filter((s) => {
    if (!filters.search) return true;
    const normalizedTracking = normalizeTrackingNumber(s.trackingNumber);
    return (
      normalizedTracking.includes(normalizedSearch) ||
      s.senderName.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(filters.search.toLowerCase())
    );
  });

  return (
    <AdminLayout active="Shipments">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
        <Link href="/admin/shipments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Shipment
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Input
              placeholder="Search tracking #, sender, recipient..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </Select>
          <Select
            value={filters.branchId}
            onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState message="No shipments found." icon={<Package className="h-12 w-12" />} />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tracking #</Th>
              <Th>Sender</Th>
              <Th>Recipient</Th>
              <Th>Route</Th>
              <Th>Status</Th>
              <Th>Weight</Th>
              <Th>Created</Th>
              <Th>Est. Delivery</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td>
                  <Link href={`/admin/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                    {s.trackingNumber}
                  </Link>
                </Td>
                <Td>{s.senderName}</Td>
                <Td>{s.recipientName}</Td>
                <Td className="text-xs">{s.originBranch?.name} → {s.destBranch?.name}</Td>
                <Td><Badge status={s.status} /></Td>
                <Td>{s.weight ? `${s.weight}kg` : "—"}</Td>
                <Td>{formatDate(s.createdAt)}</Td>
                <Td>{formatDate(s.estimatedDelivery)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  );
}
