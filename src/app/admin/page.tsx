"use client";

import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, AlertCircle, Building2, Users } from "lucide-react";
import { Card, Badge, Table, Th, Td } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Shipments", value: stats?.total ?? 0, icon: Package, color: "text-brand-600 bg-brand-50" },
    { label: "In Transit", value: stats?.inTransit ?? 0, icon: Truck, color: "text-indigo-600 bg-indigo-50" },
    { label: "Delivered", value: stats?.delivered ?? 0, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Delayed/Exception", value: stats?.delayed ?? 0, icon: AlertCircle, color: "text-red-600 bg-red-50" },
    { label: "Branches", value: stats?.branches ?? 0, icon: Building2, color: "text-amber-600 bg-amber-50" },
    { label: "Customers", value: stats?.customers ?? 0, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <AdminLayout active="Dashboard">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading stats...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="p-4">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </Card>
              );
            })}
          </div>

          {stats?.dailyStats && stats.dailyStats.length > 0 && (
            <Card className="mt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Distribution (Last 30 Days)</h2>
              <div className="space-y-3">
                {stats.dailyStats.map((stat: any) => (
                  <div key={stat.status} className="flex items-center gap-4">
                    <div className="w-32">
                      <Badge status={stat.status} />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 w-full rounded-full bg-gray-100">
                        <div
                          className="h-4 rounded-full bg-brand-500"
                          style={{ width: `${Math.min((stat._count / stats.total) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-gray-700">{stat._count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>
              <Link href="/admin/shipments" className="text-sm font-medium text-brand-600 hover:underline">
                View All
              </Link>
            </div>
            {stats?.recentShipments?.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Tracking #</Th>
                    <Th>Sender</Th>
                    <Th>Recipient</Th>
                    <Th>Route</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentShipments.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <Td>
                        <Link href={`/admin/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                          {s.trackingNumber}
                        </Link>
                      </Td>
                      <Td>{s.senderName}</Td>
                      <Td>{s.recipientName}</Td>
                      <Td>{s.originBranch?.name} → {s.destBranch?.name}</Td>
                      <Td><Badge status={s.status} /></Td>
                      <Td>{formatDate(s.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-gray-500">No shipments yet.</p>
            )}
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
