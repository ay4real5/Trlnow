"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, Edit3, X } from "lucide-react";
import { Card, Button, Input, Label, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });

  const fetchBranches = () => {
    setLoading(true);
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => setBranches(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ name: "", address: "", phone: "", email: "" });
    setEditing(null);
    setShowForm(false);
    fetchBranches();
  };

  const handleEdit = (branch: any) => {
    setEditing(branch);
    setForm({ name: branch.name, address: branch.address, phone: branch.phone || "", email: branch.email || "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch?")) return;
    await fetch(`/api/branches?id=${id}`, { method: "DELETE" });
    fetchBranches();
  };

  return (
    <AdminLayout active="Branches">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: "", address: "", phone: "", email: "" }); }}>
          {showForm ? <><X className="mr-2 h-4 w-4" />Close</> : <><Plus className="mr-2 h-4 w-4" />Add Branch</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{editing ? "Edit Branch" : "New Branch"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Address *</Label>
              <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{editing ? "Update Branch" : "Create Branch"}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : branches.length === 0 ? (
        <Card>
          <EmptyState message="No branches yet. Add one to get started." icon={<Building2 className="h-12 w-12" />} />
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Address</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <Td className="font-medium text-gray-900">{b.name}</Td>
                <Td>{b.address}</Td>
                <Td>{b.phone || "—"}</Td>
                <Td>{b.email || "—"}</Td>
                <Td>{formatDate(b.createdAt)}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(b)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </AdminLayout>
  );
}
