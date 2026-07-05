"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import { Card, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout active="Customers">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Customers</h1>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : customers.length === 0 ? (
        <Card>
          <EmptyState message="No customers registered yet." icon={<Users className="h-12 w-12" />} />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Registered</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td className="font-medium text-gray-900">{c.name}</Td>
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
