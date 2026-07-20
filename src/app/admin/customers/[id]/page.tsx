"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Calendar, Package, Trash2, KeyRound,
  Ban, CheckCircle, Save, Shield, StickyNote, Bell,
} from "lucide-react";
import { Card, Badge, Button, Input, Label, Table, Th, Td, Textarea, EmptyState } from "@/components/ui";
import { formatDate, cn, shipmentOrigin, shipmentDest } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export const dynamic = "force-dynamic";

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCustomer = useCallback(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setCustomer(data);
          setEditForm({ name: data.name || "", email: data.email || "", phone: data.phone || "" });
          setNotes(data.adminNotes || "");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const patchCustomer = async (body: any, successText: string) => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Update failed" });
    } else {
      setMessage({ type: "success", text: successText });
      fetchCustomer();
    }
    setSaving(false);
    return res.ok;
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    patchCustomer(editForm, "Customer details updated");
  };

  const handleSaveNotes = () => patchCustomer({ adminNotes: notes }, "Internal notes saved");

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage({ type: "error", text: "Enter a new password first" });
      return;
    }
    const ok = await patchCustomer({ newPassword }, "Password reset — share the new password with the customer securely");
    if (ok) setNewPassword("");
  };

  const handleToggleSuspend = async () => {
    const suspending = customer.status !== "suspended";
    if (suspending && !confirm(`Suspend ${customer.name}'s account? They will not be able to log in.`)) return;
    patchCustomer(
      { status: suspending ? "suspended" : "active" },
      suspending ? "Account suspended — the customer can no longer log in" : "Account reactivated"
    );
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${customer.name}'s account? Their shipments will be kept but unlinked. This cannot be undone.`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/customers");
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Delete failed" });
    }
  };

  if (loading) {
    return (
      <AdminLayout active="Customers">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout active="Customers">
        <p className="text-gray-500">Customer not found.</p>
      </AdminLayout>
    );
  }

  const suspended = customer.status === "suspended";
  const shipments = customer.sentShipments || [];
  const notifications = customer.notifications || [];

  return (
    <AdminLayout active="Customers">
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">{customer.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="flex min-w-0 items-center gap-1.5 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{customer.email}</span>
            {customer.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{customer.phone}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />Joined {formatDate(customer.createdAt)}</span>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
            suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          )}
        >
          {suspended ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {suspended ? "Suspended" : "Active"}
        </span>
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 rounded-lg px-4 py-3 text-sm",
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Shipments ({shipments.length})
            </h2>
            {shipments.length === 0 ? (
              <EmptyState message="No shipments for this customer yet." icon={<Package className="h-12 w-12" />} />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tracking #</Th>
                    <Th>Recipient</Th>
                    <Th>Route</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <Td>
                        <Link href={`/admin/shipments/${s.id}`} className="font-medium text-brand-600 hover:underline">
                          {s.trackingNumber}
                        </Link>
                      </Td>
                      <Td>{s.recipientName}</Td>
                      <Td className="text-xs">{shipmentOrigin(s)} → {shipmentDest(s)}</Td>
                      <Td><Badge status={s.status} /></Td>
                      <Td>{formatDate(s.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bell className="h-5 w-5 text-gray-400" />
              Recent Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications sent to this customer yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {notifications.map((n: any) => (
                  <li key={n.id} className="flex items-start justify-between gap-4 rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-gray-700">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {n.shipment?.trackingNumber} · {formatDate(n.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        n.status === "sent" ? "bg-green-100 text-green-700" :
                        n.status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {n.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {isAdmin ? (
            <>
              <Card>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Details</h2>
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full">
                    <Save className="mr-2 inline h-4 w-4" />
                    Save Details
                  </Button>
                </form>
              </Card>

              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <StickyNote className="h-5 w-5 text-gray-400" />
                  Internal Notes
                </h2>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Notes visible only to staff — complaints, special handling, payment issues..."
                />
                <Button onClick={handleSaveNotes} disabled={saving} variant="secondary" className="mt-3 w-full">
                  Save Notes
                </Button>
              </Card>

              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                  Reset Password
                </h2>
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                  />
                  <Button onClick={handleResetPassword} disabled={saving} variant="outline" className="w-full">
                    Set New Password
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Danger Zone</h2>
                <div className="space-y-3">
                  <Button
                    onClick={handleToggleSuspend}
                    disabled={saving}
                    variant={suspended ? "primary" : "outline"}
                    className={cn("w-full", !suspended && "border-red-300 text-red-600 hover:bg-red-50")}
                  >
                    {suspended ? (
                      <><CheckCircle className="mr-2 inline h-4 w-4" />Reactivate Account</>
                    ) : (
                      <><Ban className="mr-2 inline h-4 w-4" />Suspend Account</>
                    )}
                  </Button>
                  <Button onClick={handleDelete} disabled={saving} variant="danger" className="w-full">
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Delete Account
                  </Button>
                  <p className="text-xs text-gray-400">
                    Suspending blocks login but keeps all data. Deleting removes the account permanently; shipments are kept but unlinked.
                  </p>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4" />
                  Admin access required
                </div>
                <p>Only admins can edit customer accounts.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
