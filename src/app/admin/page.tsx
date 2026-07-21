"use client";

import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, AlertCircle, Building2, Users, KeyRound } from "lucide-react";
import { Card, Badge, Table, Th, Td, Button, Input, Label } from "@/components/ui";
import { formatDate, shipmentOrigin, shipmentDest } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Failed to change password" });
    } else {
      setMessage({ type: "success", text: "Password changed" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    setSaving(false);
  };

  return (
    <Card className="mt-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <KeyRound className="h-5 w-5 text-gray-400" />
        Change My Password
      </h2>
      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Current Password</Label>
          <Input type="password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div>
          <Label>New Password</Label>
          <Input type="password" required minLength={6} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
        <div>
          <Label>Confirm New Password</Label>
          <Input type="password" required minLength={6} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

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
                      <Td>{shipmentOrigin(s)} → {shipmentDest(s)}</Td>
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

          <ChangePasswordCard />
        </>
      )}
    </AdminLayout>
  );
}
