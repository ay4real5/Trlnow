"use client";

import { useState, useEffect } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Card, Button, Select, Label } from "@/components/ui";
import { SHIPMENT_STATUSES, STATUS_LABELS } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminReportsPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: "", branchId: "", from: "", to: "" });

  useEffect(() => {
    fetch("/api/branches").then((r) => r.json()).then((data) => setBranches(data));
  }, []);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.branchId) params.set("branchId", filters.branchId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    window.open(`/api/reports?${params.toString()}`, "_blank");
  };

  return (
    <AdminLayout active="Reports">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reports & Exports</h1>

      <Card>
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-6 w-6 text-brand-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Shipment Report</h2>
            <p className="text-sm text-gray-500">Export filtered shipments as a CSV file</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Status</Label>
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={filters.branchId} onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}>
              <option value="">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>From Date</Label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <Label>To Date</Label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>
    </AdminLayout>
  );
}
