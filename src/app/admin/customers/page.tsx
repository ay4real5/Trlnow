"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Mail, Phone, Calendar, Package } from "lucide-react";
import { Card, Table, Th, Td, EmptyState, Input, Select } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    if (statusFilter && (c.status || "active") !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout active="Customers">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">{customers.length} registered</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Accounts</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState message="No customers found." icon={<Users className="h-12 w-12" />} />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Account</Th>
              <Th>Shipments</Th>
              <Th>Registered</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td className="font-medium">
                  <Link href={`/admin/customers/${c.id}`} className="text-brand-600 hover:underline">
                    {c.name}
                  </Link>
                </Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {c.email}
                  </span>
                </Td>
                <Td>
                  {c.phone ? (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {c.phone}
                    </span>
                  ) : "—"}
                </Td>
                <Td>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      (c.status || "active") === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {(c.status || "active") === "suspended" ? "Suspended" : "Active"}
                  </span>
                </Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    {c._count?.sentShipments ?? 0}
                  </span>
                </Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {formatDate(c.createdAt)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  );
}
