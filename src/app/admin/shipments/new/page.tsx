"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, Button, Input, Label, Select } from "@/components/ui";
import AdminLayout from "@/components/AdminLayout";

export default function NewShipmentPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    senderId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    originBranchId: "",
    destBranchId: "",
    weight: "",
    estimatedDelivery: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([b, c]) => {
      setBranches(b);
      setCustomers(c);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create shipment");
      setLoading(false);
      return;
    }

    const shipment = await res.json();
    router.push(`/admin/shipments/${shipment.id}`);
  };

  return (
    <AdminLayout active="Shipments">
      <Link href="/admin/shipments" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />
        Back to Shipments
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">New Shipment</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Sender Details</h2>
            <div className="space-y-4">
              <div>
                <Label>Registered Customer (optional)</Label>
                <Select
                  value={form.senderId}
                  onChange={(e) => {
                    const c = customers.find((cu) => cu.id === e.target.value);
                    setForm({
                      ...form,
                      senderId: e.target.value,
                      senderName: c?.name || form.senderName,
                      senderPhone: c?.phone || form.senderPhone,
                    });
                  }}
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Sender Name *</Label>
                <Input required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
              </div>
              <div>
                <Label>Sender Phone</Label>
                <Input value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} />
              </div>
              <div>
                <Label>Sender Address</Label>
                <Input value={form.senderAddress} onChange={(e) => setForm({ ...form, senderAddress: e.target.value })} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recipient Details</h2>
            <div className="space-y-4">
              <div>
                <Label>Recipient Name *</Label>
                <Input required value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
              </div>
              <div>
                <Label>Recipient Phone</Label>
                <Input value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} />
              </div>
              <div>
                <Label>Recipient Address</Label>
                <Input value={form.recipientAddress} onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipment Details</h2>
            <div className="space-y-4">
              <div>
                <Label>Origin Branch *</Label>
                <Select required value={form.originBranchId} onChange={(e) => setForm({ ...form, originBranchId: e.target.value })}>
                  <option value="">— Select branch —</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Destination Branch *</Label>
                <Select required value={form.destBranchId} onChange={(e) => setForm({ ...form, destBranchId: e.target.value })}>
                  <option value="">— Select branch —</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div>
                <Label>Estimated Delivery Date</Label>
                <Input type="date" value={form.estimatedDelivery} onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })} />
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Shipment"}
          </Button>
          <Link href="/admin/shipments">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
